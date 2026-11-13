const pool = require('../db/pool');

async function findUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
}

async function findUserById(userId) {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    return rows[0] || null;
}

async function incrementFailedLogin(userId) {
    await pool.query(
        'UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?',
        [userId]
    );
    const [rows] = await pool.query(
        'SELECT failed_login_attempts FROM users WHERE user_id = ?',
        [userId]
    );
    return rows[0] ? rows[0].failed_login_attempts : 0;
}

async function lockAccount(userId, lockMinutes) {
    await pool.query(
        'UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE), failed_login_attempts = 0 WHERE user_id = ?',
        [lockMinutes, userId]
    );
}

async function resetLoginFailures(userId) {
    await pool.query(
        'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = ?',
        [userId]
    );
}

async function updatePasswordHash(userId, passwordHash, options = {}) {
    const mustChange = options.mustChangePassword === undefined ? null : options.mustChangePassword;
    if (mustChange === null) {
        await pool.query(
            'UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE user_id = ?',
            [passwordHash, userId]
        );
    } else {
        await pool.query(
            'UPDATE users SET password_hash = ?, password_changed_at = NOW(), must_change_password = ? WHERE user_id = ?',
            [passwordHash, mustChange ? 1 : 0, userId]
        );
    }
}

async function setPendingTwoFactorSecret(userId, secret) {
    await pool.query(
        'UPDATE users SET two_factor_pending_secret = ? WHERE user_id = ?',
        [secret, userId]
    );
}

async function enableTwoFactor(userId, secret, backupCodesJson) {
    await pool.query(
        `UPDATE users
         SET two_factor_enabled = 1,
             two_factor_secret = ?,
             two_factor_pending_secret = NULL,
             backup_codes = ?
         WHERE user_id = ?`,
        [secret, backupCodesJson, userId]
    );
}

async function disableTwoFactor(userId) {
    await pool.query(
        `UPDATE users
         SET two_factor_enabled = 0,
             two_factor_secret = NULL,
             two_factor_pending_secret = NULL,
             backup_codes = NULL
         WHERE user_id = ?`,
        [userId]
    );
}

async function updateBackupCodes(userId, backupCodesJson) {
    await pool.query('UPDATE users SET backup_codes = ? WHERE user_id = ?', [backupCodesJson, userId]);
}

module.exports = {
    findUserByUsername,
    findUserById,
    incrementFailedLogin,
    lockAccount,
    resetLoginFailures,
    updatePasswordHash,
    setPendingTwoFactorSecret,
    enableTwoFactor,
    disableTwoFactor,
    updateBackupCodes
};
