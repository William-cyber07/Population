// reset-passwords.js
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: 3306
}).promise();

async function resetPasswords() {
    try {
        console.log("Resetting admin password...");
        const adminHash = await bcrypt.hash('admin123', 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [adminHash, 'admin']);

        console.log("Resetting fielduser password...");
        const userHash = await bcrypt.hash('user123', 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [userHash, 'fielduser']);

        console.log("✅ Passwords reset successfully!");
        console.log("Admin: admin / admin123");
        console.log("Field User: fielduser / user123");
    } catch (err) {
        console.error("Error resetting passwords:", err);
    } finally {
        process.exit();
    }
}

resetPasswords();