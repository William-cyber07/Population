// final-reset.js
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

async function resetAll() {
    try {
        console.log("Connecting to database:", process.env.DB_DATABASE);

        // 1. DELETE the child records that reference the users table
        await pool.query("DELETE FROM person_round WHERE created_by IS NOT NULL");
        await pool.query("DELETE FROM person_round WHERE reviewed_by IS NOT NULL");

        // 2. Now it is safe to delete the old users
        await pool.query("DELETE FROM users");
        
        // 3. Create fresh users with correct bcryptjs hashes
        const adminHash = await bcrypt.hash('admin123', 10);
        const userHash = await bcrypt.hash('user123', 10);
        const testHash = await bcrypt.hash('test123', 10);

        await pool.query(
            "INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)",
            ['admin', adminHash, 'admin', 'System Administrator']
        );
        await pool.query(
            "INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)",
            ['fielduser', userHash, 'field_user', 'Field Worker 1']
        );
        await pool.query(
            "INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)",
            ['testuser', testHash, 'field_user', 'Test User']
        );

        console.log("✅ SUCCESS! All users created.");
        console.log("Admin: admin / admin123");
        console.log("Field User: fielduser / user123");
        console.log("Test User: testuser / test123");

        process.exit();
    } catch (err) {
        console.error("Error:", err.message);
        process.exit();
    }
}

resetAll();