// services/auditService.js
// Append-only security audit trail. Logging failures must never break the
// request being audited, so all errors are swallowed after being reported.
const pool = require('../db/pool');

async function logEvent({
    userId = null,
    action,
    targetType = null,
    targetId = null,
    req = null,
    details = null
}) {
    try {
        const ipAddress = req ? (req.ip || req.socket?.remoteAddress || null) : null;
        const userAgent = req ? (req.get?.('user-agent') || null) : null;

        await pool.query(
            `INSERT INTO audit_log
                (user_id, action, target_type, target_id, ip_address, user_agent, details)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                action,
                targetType,
                targetId === null ? null : String(targetId),
                ipAddress ? String(ipAddress).slice(0, 45) : null,
                userAgent ? String(userAgent).slice(0, 255) : null,
                details ? String(details).slice(0, 2000) : null
            ]
        );
    } catch (error) {
        console.error('Audit log write failed:', error.message);
    }
}

module.exports = { logEvent };
