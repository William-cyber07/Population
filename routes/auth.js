// routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authService = require('../services/authService');
const authRepo = require('../repositories/authRepository');
const auditService = require('../services/auditService');
const { requireAuth } = require('../middleware/auth');
const { COOKIE_SECURE } = require('../config/env');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' }
});

function setSessionCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });
}

// POST /api/auth/login
// Public first factor. Returns either a session cookie or a short-lived
// challenge token when the account has 2FA enabled.
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (typeof username !== 'string' || typeof password !== 'string' ||
            !username.trim() || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await authService.loginUser(username.trim(), password);

        if (result.requires2fa) {
            await auditService.logEvent({
                action: 'LOGIN_2FA_CHALLENGE',
                req,
                details: `username=${username.trim()}`
            });
            return res.json({ requires2fa: true, challengeToken: result.challengeToken });
        }

        setSessionCookie(res, result.token);
        await auditService.logEvent({
            userId: result.user.user_id,
            action: 'LOGIN_SUCCESS',
            req
        });
        res.json({ message: 'Login successful', user: result.user });
    } catch (error) {
        await auditService.logEvent({
            action: 'LOGIN_FAILED',
            req,
            details: error.code || 'invalid_credentials'
        });

        if (error.code === 'ACCOUNT_LOCKED') {
            return res.status(423).json({
                error: `Account temporarily locked. Try again in ${error.retryAfterMinutes} minute(s).`
            });
        }

        // Deliberately generic: do not reveal whether the username exists.
        console.error('Login error:', error.message);
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// POST /api/auth/2fa/verify
// Public second factor: exchanges a challenge token + TOTP/backup code for a
// real session cookie.
router.post('/2fa/verify', authLimiter, async (req, res) => {
    try {
        const { challengeToken, code } = req.body;
        if (!challengeToken || !code) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        const result = await authService.verifySecondFactor(challengeToken, String(code));
        setSessionCookie(res, result.token);

        await auditService.logEvent({
            userId: result.user.user_id,
            action: 'LOGIN_2FA_SUCCESS',
            req
        });

        res.json({ message: 'Login successful', user: result.user });
    } catch (error) {
        await auditService.logEvent({
            action: 'LOGIN_2FA_FAILED',
            req,
            details: error.code || 'invalid_code'
        });

        if (error.code === 'INVALID_CHALLENGE') {
            return res.status(401).json({ error: error.message });
        }
        res.status(401).json({ error: 'Invalid verification code' });
    }
});

// POST /api/auth/logout
// Public on purpose: it only clears the caller's own cookie and exposes no data.
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict', secure: COOKIE_SECURE });
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await authRepo.findUserById(req.user.user_id);
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        res.json(authService.sanitizeUser(user));
    } catch (error) {
        console.error('Error loading current user:', error);
        res.status(500).json({ error: 'Failed to load current user' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        await authService.changePassword(req.user.user_id, currentPassword, newPassword);

        // Re-issue the session so the must_change_password flag is cleared
        // without forcing the user to log in again.
        const updatedUser = await authRepo.findUserById(req.user.user_id);
        setSessionCookie(res, authService.issueSessionToken(updatedUser));

        await auditService.logEvent({
            userId: req.user.user_id,
            action: 'PASSWORD_CHANGED',
            req
        });

        res.json({
            message: 'Password changed successfully',
            user: authService.sanitizeUser(updatedUser)
        });
    } catch (error) {
        if (error.code === 'INVALID_CURRENT_PASSWORD') {
            return res.status(401).json({ error: error.message });
        }
        if (error.code === 'WEAK_PASSWORD' || error.code === 'PASSWORD_UNCHANGED') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// POST /api/auth/2fa/setup
router.post('/2fa/setup', requireAuth, async (req, res) => {
    try {
        const result = await authService.startTwoFactorSetup(req.user.user_id);
        await auditService.logEvent({
            userId: req.user.user_id,
            action: '2FA_SETUP_STARTED',
            req
        });
        res.json(result);
    } catch (error) {
        if (error.code === 'TWO_FACTOR_ALREADY_ENABLED') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Error starting 2FA setup:', error);
        res.status(500).json({ error: 'Failed to start two-factor setup' });
    }
});

// POST /api/auth/2fa/enable
router.post('/2fa/enable', requireAuth, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Verification code is required' });
        }

        const result = await authService.enableTwoFactor(req.user.user_id, String(code));

        await auditService.logEvent({
            userId: req.user.user_id,
            action: '2FA_ENABLED',
            req
        });

        res.json({
            message: 'Two-factor authentication enabled',
            backupCodes: result.backupCodes
        });
    } catch (error) {
        if (error.code === 'INVALID_2FA_CODE') {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === 'TWO_FACTOR_ALREADY_ENABLED') {
            return res.status(409).json({ error: error.message });
        }
        if (error.code === 'TWO_FACTOR_SETUP_MISSING') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error enabling 2FA:', error);
        res.status(500).json({ error: 'Failed to enable two-factor authentication' });
    }
});

// POST /api/auth/2fa/disable
router.post('/2fa/disable', requireAuth, async (req, res) => {
    try {
        const { password, code } = req.body;
        if (!password || !code) {
            return res.status(400).json({ error: 'Password and verification code are required' });
        }

        await authService.disableTwoFactor(req.user.user_id, password, String(code));

        await auditService.logEvent({
            userId: req.user.user_id,
            action: '2FA_DISABLED',
            req
        });

        res.json({ message: 'Two-factor authentication disabled' });
    } catch (error) {
        if (error.code === 'INVALID_CURRENT_PASSWORD') {
            return res.status(401).json({ error: error.message });
        }
        if (error.code === 'INVALID_2FA_CODE' || error.code === 'TWO_FACTOR_NOT_ENABLED') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ error: 'Failed to disable two-factor authentication' });
    }
});

module.exports = router;
