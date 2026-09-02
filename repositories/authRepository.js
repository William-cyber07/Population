const pool = require('../db/pool');

async function findUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
}

module.exports = {
    findUserByUsername
};