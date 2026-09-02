// routes/auth.js
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const { user, token } = await authService.loginUser(username, password);

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = authService.verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.json(decoded);
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify authentication' });
    }
});

module.exports = router;