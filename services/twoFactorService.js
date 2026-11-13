// services/twoFactorService.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const { generateSecret, generateURI, verify } = require('otplib');
const { TWO_FACTOR_ISSUER } = require('../config/env');

const BACKUP_CODE_COUNT = 10;

function generateEnrollment(username) {
    const secret = generateSecret();
    const otpauthUrl = generateURI({
        issuer: TWO_FACTOR_ISSUER,
        label: username,
        secret
    });
    return { secret, otpauthUrl };
}

async function buildQrCode(otpauthUrl) {
    return QRCode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 240
    });
}

async function verifyTotp(secret, token) {
    if (!secret || !token) return false;
    const normalized = String(token).replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalized)) return false;

    try {
        const result = await verify({ secret, token: normalized });
        return result.valid === true;
    } catch (error) {
        return false;
    }
}

function generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
        // 10 hex characters, grouped for readability: abcde-fghij
        const raw = crypto.randomBytes(5).toString('hex');
        codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
    }
    return codes;
}

async function hashBackupCodes(codes) {
    return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

async function verifyBackupCode(code, backupCodesJson) {
    let hashes = [];
    try {
        hashes = JSON.parse(backupCodesJson || '[]');
    } catch (error) {
        hashes = [];
    }

    const normalized = String(code).trim().toLowerCase();
    for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(normalized, hashes[i])) {
            const remaining = hashes.filter((_, index) => index !== i);
            return { valid: true, remaining };
        }
    }
    return { valid: false, remaining: hashes };
}

module.exports = {
    generateEnrollment,
    buildQrCode,
    verifyTotp,
    generateBackupCodes,
    hashBackupCodes,
    verifyBackupCode
};
