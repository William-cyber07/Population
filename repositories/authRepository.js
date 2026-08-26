// repositories/authRepository.js
const pool = require('../db/pool');

// Find a user by username
async function findUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
}

// Create a new user (for future admin sign-ups)
async function createUser(username, passwordHash, role, fullName) {
    const query = 'INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(query, [username, passwordHash, role, fullName]);
    return result;
}

module.exports = {
    findUserByUsername,
    createUser
};