// services/passwordService.js
const bcrypt = require('bcryptjs');
const { PASSWORD_PEPPER } = require('../config/env');

const BCRYPT_ROUNDS = 12;

function pepper(password) {
    return `${password}${PASSWORD_PEPPER}`;
}

/**
 * Hashes a password with the app-level pepper and bcrypt's built-in salt.
 */
async function hashPassword(password) {
    return bcrypt.hash(pepper(password), BCRYPT_ROUNDS);
}

/**
 * Verifies a password. Existing hashes created before the pepper was
 * introduced are still accepted and flagged for re-hashing on next login.
 */
async function verifyPassword(password, hash) {
    if (!hash) return { valid: false, needsRehash: false };

    if (await bcrypt.compare(pepper(password), hash)) {
        return { valid: true, needsRehash: false };
    }

    // Legacy fallback: hashes created before PASSWORD_PEPPER existed.
    if (await bcrypt.compare(password, hash)) {
        return { valid: true, needsRehash: true };
    }

    return { valid: false, needsRehash: false };
}

/**
 * Returns an error message when the password does not meet policy, otherwise null.
 */
function validatePasswordPolicy(password) {
    if (typeof password !== 'string' || password.length < 10) {
        return 'Password must be at least 10 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter.';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number.';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must contain at least one symbol.';
    }
    return null;
}

module.exports = {
    hashPassword,
    verifyPassword,
    validatePasswordPolicy
};
