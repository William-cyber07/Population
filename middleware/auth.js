// middleware/auth.js
const authService = require('../services/authService');

/**
 * Requires a valid, signed JWT in the `token` cookie.
 * On success attaches the decoded payload to req.user.
 */
function requireAuth(req, res, next) {
    const token = req.cookies ? req.cookies.token : null;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
}

/**
 * Blocks every protected route until the user has replaced a temporary
 * password. Auth routes are mounted before this middleware, so login,
 * logout, /me and change-password stay reachable.
 */
function requirePasswordChanged(req, res, next) {
    if (req.user && req.user.must_change_password) {
        return res.status(403).json({
            error: 'You must change your password before continuing',
            code: 'PASSWORD_CHANGE_REQUIRED'
        });
    }
    next();
}

/**
 * Requires req.user.role to be one of the supplied roles.
 * Must be used after requireAuth.
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requirePasswordChanged,
    requireRole
};
