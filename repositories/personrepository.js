const pool = require('../db/pool');
const withTransaction = require('../db/transaction');


async function createPersonAndRound(personData) {
    // We use the transaction helper to run this inside a transaction
    return withTransaction(async (connection) => {
        
        // 1. AUTO-GENERATE THE PERSONID
        let newPersonId = personData.personid;
        
        if (!newPersonId) {
            // Find the highest personid currently in the database
            const [rows] = await connection.query(
                'SELECT personid FROM person ORDER BY personid DESC LIMIT 1'
            );
            
            if (rows.length === 0) {
                // If there are no people yet, start at PID001
                newPersonId = 'PID001';
            } else {
                // Extract the number part (e.g. "PID013" -> "013" -> 13)
                const lastId = rows[0].personid;
                const lastNum = parseInt(lastId.replace('PID', '')) || 0;
                const nextNum = lastNum + 1;
                // Format with leading zeros: 14 -> "PID014"
                newPersonId = 'PID' + nextNum.toString().padStart(3, '0');
            }
        }

        // 2. Insert into the "person" table
        const personQuery = `
            INSERT INTO person (personid)
            VALUES (?)
        `;
        const [personResult] = await connection.query(personQuery, [newPersonId]);
        const newPersonIdPk = personResult.insertId;

        // 3. Insert into the "person_round" table
        const roundQuery = `
            INSERT INTO person_round (
                person_id, 
                household_round_id, 
                sex, 
                relationship_id, 
                age_years,
                age_months,
                pop_weight,
                status,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const roundValues = [
            newPersonIdPk,
            personData.household_round_id,
            personData.sex,
            personData.relationship_id,
            personData.age_years,
            personData.age_months || 0,
            personData.pop_weight || 100.0,
            'draft',
            personData.created_by || 12 // Use the actual logged-in user ID
        ];

        const [roundResult] = await connection.query(roundQuery, roundValues);
        const newPersonRoundId = roundResult.insertId;

        // Return the generated IDs
        return {
            person_id: newPersonIdPk,
            person_round_id: newPersonRoundId,
            personid: newPersonId // Return the generated "PIDxxx"
        };
    });
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