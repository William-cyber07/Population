// services/authService.js
const jwt = require('jsonwebtoken');
const authRepo = require('../repositories/authRepository');
const passwordService = require('./passwordService');
const twoFactorService = require('./twoFactorService');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const CHALLENGE_EXPIRES_IN = '5m';

function sanitizeUser(user) {
    if (!user) return null;
    const {
        password_hash,
        two_factor_secret,
        two_factor_pending_secret,
        backup_codes,
        failed_login_attempts,
        locked_until,
        ...safeUser
    } = user;
    return safeUser;
}

function issueSessionToken(user) {
    return jwt.sign(
        {
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            assigned_district_id: user.assigned_district_id ?? null,
            must_change_password: Boolean(user.must_change_password),
            scope: 'session'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function signChallengeToken(user) {
    return jwt.sign(
        { user_id: user.user_id, scope: '2fa' },
        JWT_SECRET,
        { expiresIn: CHALLENGE_EXPIRES_IN }
    );
}

function verifyChallengeToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.scope !== '2fa' || !decoded.user_id) return null;
        return decoded;
    } catch (error) {
        return null;
    }
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Challenge tokens must never be accepted as a session.
        if (decoded.scope !== 'session') return null;
        return decoded;
    } catch (error) {
        return null;
    }
}

async function loginUser(username, password) {
    const user = await authRepo.findUserByUsername(username);

    // Always run a bcrypt comparison to reduce username-enumeration timing
    // differences, even when the account does not exist.
    if (!user) {
        await passwordService.verifyPassword(password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid');
        throw new Error('Invalid username or password');
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
        const retryAfterMinutes = Math.max(
            1,
            Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000)
        );
        const error = new Error('Account temporarily locked');
        error.code = 'ACCOUNT_LOCKED';
        error.retryAfterMinutes = retryAfterMinutes;
        throw error;
    }

    const { valid, needsRehash } = await passwordService.verifyPassword(password, user.password_hash);

    if (!valid) {
        const attempts = await authRepo.incrementFailedLogin(user.user_id);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            await authRepo.lockAccount(user.user_id, LOCK_MINUTES);
        }
        throw new Error('Invalid username or password');
    }

    await authRepo.resetLoginFailures(user.user_id);

    // Transparently upgrade legacy (unpeppered / lower-cost) hashes.
    if (needsRehash) {
        const upgradedHash = await passwordService.hashPassword(password);
        await authRepo.updatePasswordHash(user.user_id, upgradedHash);
    }

    if (user.two_factor_enabled) {
        return { requires2fa: true, challengeToken: signChallengeToken(user) };
    }

    return {
        user: sanitizeUser(user),
        token: issueSessionToken(user)
    };
}

async function verifySecondFactor(challengeToken, code) {
    const challenge = verifyChallengeToken(challengeToken);
    if (!challenge) {
        const error = new Error('Verification session expired. Please log in again.');
        error.code = 'INVALID_CHALLENGE';
        throw error;
    }

    const user = await authRepo.findUserById(challenge.user_id);
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
        const error = new Error('Two-factor authentication is not enabled for this account.');
        error.code = 'TWO_FACTOR_NOT_ENABLED';
        throw error;
    }

    const totpValid = await twoFactorService.verifyTotp(user.two_factor_secret, code);
    if (!totpValid) {
        const backup = await twoFactorService.verifyBackupCode(code, user.backup_codes);
        if (!backup.valid) {
            throw new Error('Invalid verification code');
        }
        // Backup codes are single-use.
        await authRepo.updateBackupCodes(user.user_id, JSON.stringify(backup.remaining));
    }

    await authRepo.resetLoginFailures(user.user_id);

    return {
        user: sanitizeUser(user),
        token: issueSessionToken(user)
    };
}

async function changePassword(userId, currentPassword, newPassword) {
    const user = await authRepo.findUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const { valid } = await passwordService.verifyPassword(currentPassword, user.password_hash);
    if (!valid) {
        const error = new Error('Current password is incorrect');
        error.code = 'INVALID_CURRENT_PASSWORD';
        throw error;
    }

    const policyError = passwordService.validatePasswordPolicy(newPassword);
    if (policyError) {
        const error = new Error(policyError);
        error.code = 'WEAK_PASSWORD';
        throw error;
    }

    if (currentPassword === newPassword) {
        const error = new Error('New password must be different from the current password');
        error.code = 'PASSWORD_UNCHANGED';
        throw error;
    }

    const newHash = await passwordService.hashPassword(newPassword);
    await authRepo.updatePasswordHash(userId, newHash, { mustChangePassword: false });
}

async function startTwoFactorSetup(userId) {
    const user = await authRepo.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.two_factor_enabled) {
        const error = new Error('Two-factor authentication is already enabled');
        error.code = 'TWO_FACTOR_ALREADY_ENABLED';
        throw error;
    }

    const { secret, otpauthUrl } = twoFactorService.generateEnrollment(user.username);
    await authRepo.setPendingTwoFactorSecret(userId, secret);
    const qrDataUrl = await twoFactorService.buildQrCode(otpauthUrl);

    return { secret, otpauthUrl, qrDataUrl };
}

async function enableTwoFactor(userId, code) {
    const user = await authRepo.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.two_factor_enabled) {
        const error = new Error('Two-factor authentication is already enabled');
        error.code = 'TWO_FACTOR_ALREADY_ENABLED';
        throw error;
    }
    if (!user.two_factor_pending_secret) {
        const error = new Error('Start the two-factor setup first');
        error.code = 'TWO_FACTOR_SETUP_MISSING';
        throw error;
    }

    const valid = await twoFactorService.verifyTotp(user.two_factor_pending_secret, code);
    if (!valid) {
        const error = new Error('Invalid verification code');
        error.code = 'INVALID_2FA_CODE';
        throw error;
    }

    const backupCodes = twoFactorService.generateBackupCodes();
    const hashedCodes = await twoFactorService.hashBackupCodes(backupCodes);
    await authRepo.enableTwoFactor(userId, user.two_factor_pending_secret, JSON.stringify(hashedCodes));

    return { backupCodes };
}

async function disableTwoFactor(userId, password, code) {
    const user = await authRepo.findUserById(userId);
    if (!user) throw new Error('User not found');
    if (!user.two_factor_enabled) {
        const error = new Error('Two-factor authentication is not enabled');
        error.code = 'TWO_FACTOR_NOT_ENABLED';
        throw error;
    }

    const { valid: passwordValid } = await passwordService.verifyPassword(password, user.password_hash);
    if (!passwordValid) {
        const error = new Error('Password is incorrect');
        error.code = 'INVALID_CURRENT_PASSWORD';
        throw error;
    }

    const totpValid = await twoFactorService.verifyTotp(user.two_factor_secret, code);
    if (!totpValid) {
        const backup = await twoFactorService.verifyBackupCode(code, user.backup_codes);
        if (!backup.valid) {
            const error = new Error('Invalid verification code');
            error.code = 'INVALID_2FA_CODE';
            throw error;
        }
    }

    await authRepo.disableTwoFactor(userId);
}

module.exports = {
    sanitizeUser,
    issueSessionToken,
    verifyToken,
    loginUser,
    verifySecondFactor,
    changePassword,
    startTwoFactorSetup,
    enableTwoFactor,
    disableTwoFactor
};
