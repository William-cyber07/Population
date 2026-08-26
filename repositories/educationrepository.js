const pool = require('../db/pool');

/**
 * Inserts a record into the 'education' table.
 */
async function createEducation(connection, data) {
    const query = `
        INSERT INTO education (
            person_round_id, ever_attended_school, reason_never_attended,
            highest_level_id, highest_grade_completed, attended_past_3_months,
            still_in_school, school_type, commute_mode_from, commute_mode_to,
            commute_minutes, expense_payer, received_scholarship,
            scholarship_amount, currently_in_training, training_expense_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.person_round_id, data.ever_attended_school, data.reason_never_attended,
        data.highest_level_id, data.highest_grade_completed, data.attended_past_3_months,
        data.still_in_school, data.school_type, data.commute_mode_from, data.commute_mode_to,
        data.commute_minutes, data.expense_payer, data.received_scholarship,
        data.scholarship_amount, data.currently_in_training, data.training_expense_amount
    ];

    // Note: We use the passed 'connection' to ensure this runs inside the transaction
    const [result] = await connection.query(query, values);
    return result;
}

/**
 * Inserts a training type record into 'person_round_training'.
 */
async function createTraining(connection, personRoundId, trainingType) {
    const query = `
        INSERT INTO person_round_training (person_round_id, training_type)
        VALUES (?, ?)
    `;
    
    const [result] = await connection.query(query, [personRoundId, trainingType]);
    return result;
}

/**
 * Inserts an education expense record into 'person_round_education_expense'.
 */
async function createEducationExpense(connection, personRoundId, expenseItemId, amount) {
    const query = `
        INSERT INTO person_round_education_expense (person_round_id, expense_item_id, amount)
        VALUES (?, ?, ?)
    `;

    const [result] = await connection.query(query, [personRoundId, expenseItemId, amount]);
    return result;
}

module.exports = {
    createEducation,
    createTraining,
    createEducationExpense
};