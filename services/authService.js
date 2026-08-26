const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepo = require('../repositories/authRepository');

const JWT_SECRET = 'your_secret_key_here_change_this_to_something_long'; // In a real app, put this in your .env file!

async function loginUser(username, password) {
    // 1. Find the user in the database
    const user = await authRepo.findUserByUsername(username);
    if (!user) {
        throw new Error('Invalid username or password');
    }

    // 2. Compare the entered password with the stored hash
    // Note: In a real system, we would hash the 'admin123' password, but here we check plain text for simplicity.
    const isValidPassword = (password === user.password_hash); 

    if (!isValidPassword) {
        throw new Error('Invalid username or password');
    }

    // 3. Generate a JSON Web Token (JWT)
    const token = jwt.sign(
        { 
            user_id: user.user_id, 
            username: user.username, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' } // The token expires after 24 hours
    );

    // 4. Return the user object (without the password) and the token
    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
}

// Verify the JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}


// Generates a random username and a secure random password
 
function generateUserCredentials() {
    // 1. Generate a unique username (user_ + random 5-digit number)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const username = `user_${randomNum}`;
    
    // 2. Generate a random 8-character password (Mix of letters and numbers)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return { username, password };
}

// Export the new function
module.exports = {
    loginUser,
    verifyToken,
    generateUserCredentials // <--- Add this export
};
