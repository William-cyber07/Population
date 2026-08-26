const pool = require('../db/pool');

/**
 * Inserts a record into the 'health_episode' table.
 */
async function createHealthEpisode(connection, data) {
    const query = `
        INSERT INTO health_episode (
            person_round_id, illness_or_injury_2wk, days_ill, stopped_usual_activities,
            days_activity_stopped, consulted_practitioner, consulted_whom, main_reason_for_visit,
            facility_group, facility_name, facility_code, fee_registration, fee_consultation,
            fee_diagnosis, fee_drugs_treatment, fee_overall_treatment, fee_other_services,
            fee_travel, admitted_hospital_2wk, nights_in_hospital, fee_hospital_stay,
            bought_medicine, fee_medicine, total_medical_expense, admitted_hospital_3mo,
            expense_admission_3mo, main_expense_payer
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.person_round_id, data.illness_or_injury_2wk, data.days_ill, data.stopped_usual_activities,
        data.days_activity_stopped, data.consulted_practitioner, data.consulted_whom, data.main_reason_for_visit,
        data.facility_group, data.facility_name, data.facility_code, data.fee_registration, data.fee_consultation,
        data.fee_diagnosis, data.fee_drugs_treatment, data.fee_overall_treatment, data.fee_other_services,
        data.fee_travel, data.admitted_hospital_2wk, data.nights_in_hospital, data.fee_hospital_stay,
        data.bought_medicine, data.fee_medicine, data.total_medical_expense, data.admitted_hospital_3mo,
        data.expense_admission_3mo, data.main_expense_payer
    ];

    const [result] = await connection.query(query, values);
    return result;
}

/**
 * Inserts a record into the 'health_insurance_anthropometry' table.
 */
async function createHealthInsurance(connection, data) {
    const query = `
        INSERT INTO health_insurance_anthropometry (
            person_round_id, ever_registered_insurance, currently_covered, weight_kg,
            height_cm, measurement_mode, bmi
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.person_round_id, data.ever_registered_insurance, data.currently_covered, data.weight_kg,
        data.height_cm, data.measurement_mode, data.bmi
    ];

    const [result] = await connection.query(query, values);
    return result;
}

/**
 * Inserts a record into the 'disability' table.
 */
async function createDisability(connection, data) {
    const query = `
        INSERT INTO disability (
            person_round_id, difficulty_seeing, dificulty_hearing, difficulty_walking,
            difficulty_remembering, difficulty_selfcare, difficulty_communications
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.person_round_id, data.difficulty_seeing, data.dificulty_hearing, data.difficulty_walking,
        data.difficulty_remembering, data.difficulty_selfcare, data.difficulty_communications
    ];

    const [result] = await connection.query(query, values);
    return result;
}

module.exports = {
    createHealthEpisode,
    createHealthInsurance,
    createDisability
};