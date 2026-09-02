// services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepo = require('../repositories/authRepository');

const JWT_SECRET = 'simple_secret_key_for_testing';

async function loginUser(username, password) {
    // 1. Find the user in the database
    console.log(`Attempting to log in user: ${username} with password: ${password}`);
    const user = await authRepo.findUserByUsername(username);
    if (!user) {
        throw new Error('Invalid username or password');
    }

console.log("Found user: ", user);
    // 2. Check the typed password against the stored bcrypt hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        throw new Error('Invalid username or password');
    }

    // 3. Generate the JWT Token
    const token = jwt.sign(
        { user_id: user.user_id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    loginUser,
    verifyToken
};