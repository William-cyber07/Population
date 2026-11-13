// services/accessService.js
// Record-level authorization. Privileged roles may access everything; everyone
// else may only touch records they created and households in their district.
const pool = require('../db/pool');
const { ROLES } = require('../constants/roles');

const PRIVILEGED_ROLES = new Set([ROLES.MANAGER, ROLES.ADMIN, ROLES.ADMINISTRATOR]);

function isPrivileged(user) {
    return Boolean(user && PRIVILEGED_ROLES.has(user.role));
}

async function getPersonRound(personRoundId) {
    const [rows] = await pool.query(
        'SELECT person_round_id, created_by, household_round_id FROM person_round WHERE person_round_id = ?',
        [personRoundId]
    );
    return rows[0] || null;
}

/**
 * Returns true when the user may read/write the given person_round row.
 * Missing rows return false so callers can respond with a generic 404.
 */
async function canAccessPersonRound(user, personRoundId) {
    if (isPrivileged(user)) return true;
    const row = await getPersonRound(personRoundId);
    if (!row) return false;
    return Number(row.created_by) === Number(user.user_id);
}

/**
 * Returns { exists, allowed } for a household_round and the user's assigned
 * district. Districts are only enforced when both sides have a value, which
 * keeps legacy rows with NULL district_id usable.
 */
async function checkHouseholdAccess(user, householdRoundId) {
    if (isPrivileged(user)) {
        return { exists: true, allowed: true };
    }

    const [rows] = await pool.query(
        'SELECT household_round_id, district_id FROM household_round WHERE household_round_id = ?',
        [householdRoundId]
    );
    if (rows.length === 0) {
        return { exists: false, allowed: false };
    }

    const districtId = rows[0].district_id;
    const assigned = user.assigned_district_id;

    if (districtId === null || districtId === undefined || assigned === null || assigned === undefined) {
        return { exists: true, allowed: true };
    }

    return { exists: true, allowed: Number(districtId) === Number(assigned) };
}

module.exports = {
    isPrivileged,
    getPersonRound,
    canAccessPersonRound,
    checkHouseholdAccess
};
