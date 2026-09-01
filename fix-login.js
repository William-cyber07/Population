const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
}).promise();

async function fixLogin() {
    try {
        console.log("Hashing new password for admin...");
        const adminHash = await bcrypt.hash('admin123', 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE username = ?', [adminHash, 'admin']);
        
        console.log("Creating a new test user 'testuser'...");
        const testHash = await bcrypt.hash('test123', 10);
        await pool.query('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)', ['testuser', testHash, 'field_user', 'Test User']);
        
        console.log("✅ DONE!");
        console.log("Admin: admin / admin123");
        console.log("Test User: testuser / test123");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

fixLogin();