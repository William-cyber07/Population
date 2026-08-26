const pool = require('../db/pool');
const withTransaction = require('../db/transaction');


async function createPersonAndRound(personData) {

    try {
        const personQuery = `
            INSERT INTO person (personid)
            VALUES (?)
        `;
        const [personResult] = await pool.query(personQuery, [personData.personid]);
        
        const newPersonId = personResult.insertId;

        const roundQuery = `
    INSERT INTO person_round (
        person_id, household_round_id, sex, relationship_id, age_years, age_months,
        pop_weight, status, created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const roundValues = [
    newPersonId, 
    personData.household_round_id, 
    personData.sex, 
    personData.relationship_id, 
    personData.age_years, 
    personData.age_months || 0, 
    personData.pop_weight || 100.0,
    personData.status || 'draft',     // 8th parameter
    personData.created_by || 2        // 9th parameter (defaults to Field User ID 2)
];

        const [roundResult] = await pool.query(roundQuery, roundValues);
        const newPersonRoundId = roundResult.insertId;

        // Return the new IDs to the caller
        return {
            person_id: newPersonId,
            person_round_id: newPersonRoundId
        };

    } catch (error) {
        throw error;
    }
}

async function getPersonRoundById(personRoundId) {
    try {
        const query = `
            SELECT 
                pr.person_round_id,
                p.personid,
                pr.household_round_id,
                pr.sex,
                pr.age_years,
                pr.pop_weight
            FROM person_round pr
            JOIN person p ON pr.person_id = p.person_id
            WHERE pr.person_round_id = ?
        `;

        const [rows] = await pool.query(query, [personRoundId]);

        return rows[0] || null;
    } catch (error) {
        // Print the full MySQL error object to the terminal
        console.error('MySQL Error Details:', error);
        throw error; 
    }
}

async function getFullPersonProfile(personRoundId) {
    try {
        const query = `
            SELECT 
                pr.person_round_id, p.personid, pr.sex, pr.age_years,
                e.ever_attended_school, e.highest_level_id,
                h.illness_or_injury_2wk, h.consulted_practitioner,
                ec.sector, ec.job_status
            FROM person_round pr
            JOIN person p ON pr.person_id = p.person_id
            LEFT JOIN education e ON pr.person_round_id = e.person_round_id
            LEFT JOIN health_episode h ON pr.person_round_id = h.person_round_id
            LEFT JOIN employment_current ec ON pr.person_round_id = ec.person_round_id
            WHERE pr.person_round_id = ?
        `;
        const [rows] = await pool.query(query, [personRoundId]);
        return rows[0] || null;
    } catch (error) { throw error; }
}

/**
 * Permanently deletes a person and ALL of their data (Cascading Delete via Transaction)
 */
async function deletePersonAndAllData(personRoundId) {
    return withTransaction(async (connection) => {
        // 1. First, get the 'person_id' so we can delete the main person record at the end
        const [personResult] = await connection.query(
            'SELECT person_id FROM person_round WHERE person_round_id = ?', 
            [personRoundId]
        );
        if (personResult.length === 0) throw new Error("Person round not found");
        const personId = personResult[0].person_id;

        // 2. Delete child records from ALL related tables
        await connection.query('DELETE FROM education WHERE person_round_id = ?', [personRoundId]);
        await connection.query('DELETE FROM health_episode WHERE person_round_id = ?', [personRoundId]);
        
        // ------- ADDED THIS -------
        await connection.query('DELETE FROM health_insurance_anthropometry WHERE person_round_id = ?', [personRoundId]);
        await connection.query('DELETE FROM disability WHERE person_round_id = ?', [personRoundId]);
        // -------------------------

        await connection.query('DELETE FROM employment_current WHERE person_round_id = ?', [personRoundId]);
        await connection.query('DELETE FROM person_round WHERE person_round_id = ?', [personRoundId]);

        // 3. Finally, delete the main person identity
        await connection.query('DELETE FROM person WHERE person_id = ?', [personId]);

        return { message: 'Person and all associated data deleted successfully' };
    });
}

/**
 * Syncs all 'draft' surveys for a specific user to 'pending_review'
 */
async function syncUserSurveys(connection, userId) {
    // Update the status for all drafts belonging to this user
    const query = `
        UPDATE person_round 
        SET status = 'pending_review' 
        WHERE status = 'draft' AND created_by = ?
    `;
    const [result] = await connection.query(query, [userId]);
    
    // Return the number of rows that were updated (how many surveys were synced)
    return result.affectedRows;
}


module.exports = {
    createPersonAndRound,
    getPersonRoundById,
    getFullPersonProfile,
    deletePersonAndAllData,
    syncUserSurveys
};