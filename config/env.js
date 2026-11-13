// config/env.js
// Single source of truth for security-sensitive environment configuration.
// Loading this module fails fast if a required secret is missing or too weak,
// so the server can never silently fall back to a hardcoded secret.
require('dotenv').config();

function requiredSecret(name, minLength) {
    const value = process.env[name];
    if (!value || value.length < minLength) {
        console.error(
            `[FATAL] ${name} is missing or shorter than ${minLength} characters.\n` +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n' +
            'and add it to your .env file (never commit .env to git).'
        );
        process.exit(1);
    }
    return value;
}

const JWT_SECRET = requiredSecret('JWT_SECRET', 32);
const PASSWORD_PEPPER = requiredSecret('PASSWORD_PEPPER', 32);

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const TWO_FACTOR_ISSUER = process.env.TWO_FACTOR_ISSUER || 'AHIES Population Survey';

// Cookies must only be sent over HTTPS in production. COOKIE_SECURE=true can
// force this on locally when running behind an HTTPS tunnel/proxy.
const COOKIE_SECURE =
    process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    PASSWORD_PEPPER,
    TWO_FACTOR_ISSUER,
    COOKIE_SECURE
};
