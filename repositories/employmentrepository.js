// repositories/employmentRepository.js

/**
 * Inserts a record into the 'employment_current' table.
 */
async function createEmploymentCurrent(connection, data) {
    const query = `
        INSERT INTO employment_current (
            person_round_id, any_activity_past_7d, reason_no_activity, 
            occupation_code_id, industry_code_id, sector, tenure_duration, 
            work_location, employment_regularity, job_status, has_contract, 
            employer_provides_health_insurance, entitled_paid_leave, 
            entitled_sick_maternity_leave, entitled_social_security, 
            social_security_scheme, entitled_subsidized_medical, payment_basis, 
            cash_payment_amount, cash_payment_unit, receives_other_payments, 
            other_payment_amount, other_payment_unit, receives_in_kind_payment, 
            in_kind_value, in_kind_unit, payment_decision_maker
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        data.person_round_id, data.any_activity_past_7d, data.reason_no_activity,
        data.occupation_code_id || null, data.industry_code_id || null, data.sector, data.tenure_duration,
        data.work_location, data.employment_regularity, data.job_status, data.has_contract,
        data.employer_provides_health_insurance, data.entitled_paid_leave,
        data.entitled_sick_maternity_leave, data.entitled_social_security,
        data.social_security_scheme, data.entitled_subsidized_medical, data.payment_basis,
        data.cash_payment_amount, data.cash_payment_unit, data.receives_other_payments,
        data.other_payment_amount, data.other_payment_unit, data.receives_in_kind_payment,
        data.in_kind_value, data.in_kind_unit, data.payment_decision_maker
    ];

    const [result] = await connection.query(query, values);
    return result;
}

/**
 * Inserts a record into 'person_round_activity' and returns the new insertId.
 */
async function createPersonRoundActivity(connection, data) {
    const query = `
        INSERT INTO person_round_activity (person_round_id, activity_type_id, did_activity, days_count, output_mainly_for_sale)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [data.person_round_id, data.activity_type_id, data.did_activity, data.days_count, data.output_mainly_for_sale || null];

    const [result] = await connection.query(query, values);
    return result.insertId; // We return this so we can use it for the daily hours
}

/**
 * Inserts a daily hour record into 'person_round_activity_day'.
 */
async function createActivityDay(connection, activityId, dayData) {
    const query = `
        INSERT INTO person_round_activity_day (person_round_activity_id, day_number, hours_worked)
        VALUES (?, ?, ?)
    `;
    const values = [activityId, dayData.day_number, dayData.hours_worked];

    const [result] = await connection.query(query, values);
    return result;
}

// --- NEW REPOSITORY FUNCTIONS FOR SECONDARY JOBS ---

/**
 * Fetches the secondary job record for a person
 */
async function getSecondaryJobByPersonRoundId(connection, personRoundId) {
    const query = `
        SELECT * FROM employment_secondary_job 
        WHERE person_round_id = ?
    `;
    const [rows] = await connection.query(query, [personRoundId]);
    return rows[0] || null;
}

/**
 * Fetches the daily hours for the secondary job
 */
async function getSecondaryJobDaysByPersonRoundId(connection, personRoundId) {
    const query = `
        SELECT day_number, hours_worked 
        FROM person_round_secondary_job_dev 
        WHERE person_round_id = ?
        ORDER BY day_number ASC
    `;
    const [rows] = await connection.query(query, [personRoundId]);
    return rows;
}

/**
 * Upserts (Creates OR Updates) the secondary job record.
 * 'ON DUPLICATE KEY UPDATE' is a MySQL trick that does both in one query.
 */
async function upsertSecondaryJob(connection, data) {
    const query = `
        INSERT INTO employment_secondary_job (
            person_round_id, job_count, occupation_code_id, industry_code_id,
            days_worked, sector, job_status, payment_basis, payment_amount,
            payment_unit, receives_in_kind, in_kind_value, in_kind_unit,
            has_contract, entitled_paid_leave, entitled_sick_maternity_leave,
            entitled_social_security, social_security_scheme, entitled_subsidized_medical,
            work_location, employment_regularity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            job_count = VALUES(job_count),
            occupation_code_id = VALUES(occupation_code_id),
            industry_code_id = VALUES(industry_code_id),
            days_worked = VALUES(days_worked),
            sector = VALUES(sector),
            job_status = VALUES(job_status),
            payment_basis = VALUES(payment_basis),
            payment_amount = VALUES(payment_amount),
            payment_unit = VALUES(payment_unit),
            receives_in_kind = VALUES(receives_in_kind),
            in_kind_value = VALUES(in_kind_value),
            in_kind_unit = VALUES(in_kind_unit),
            has_contract = VALUES(has_contract),
            entitled_paid_leave = VALUES(entitled_paid_leave),
            entitled_sick_maternity_leave = VALUES(entitled_sick_maternity_leave),
            entitled_social_security = VALUES(entitled_social_security),
            social_security_scheme = VALUES(social_security_scheme),
            entitled_subsidized_medical = VALUES(entitled_subsidized_medical),
            work_location = VALUES(work_location),
            employment_regularity = VALUES(employment_regularity)
    `;

    const values = [
        data.person_round_id, data.job_count, data.occupation_code_id || null, data.industry_code_id || null,
        data.days_worked, data.sector, data.job_status, data.payment_basis, data.payment_amount,
        data.payment_unit, data.receives_in_kind, data.in_kind_value, data.in_kind_unit,
        data.has_contract, data.entitled_paid_leave, data.entitled_sick_maternity_leave,
        data.entitled_social_security, data.social_security_scheme, data.entitled_subsidized_medical,
        data.work_location, data.employment_regularity
    ];

    const [result] = await connection.query(query, values);
    return result;
}

/**
 * Deletes the secondary job record and its daily hours
 */
async function deleteSecondaryJobByPersonRoundId(connection, personRoundId) {
    // Note: If we set up foreign key ON DELETE CASCADE, we only need to delete the parent.
    // But to be safe, we will delete the child daily records first.
    await connection.query('DELETE FROM person_round_secondary_job_dev WHERE person_round_id = ?', [personRoundId]);
    await connection.query('DELETE FROM employment_secondary_job WHERE person_round_id = ?', [personRoundId]);
    return { message: 'Secondary job and daily hours deleted successfully' };
}

// --- WORK HISTORY (employment_12month) ---
async function upsertWorkHistory(connection, data) {
    const query = `
        INSERT INTO employment_12month (
            person_round_id, worked_past_12mo, same_as_main_job, 
            occupation_code_id, industry_code_id, job_status, sector, received_payment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            worked_past_12mo = VALUES(worked_past_12mo),
            same_as_main_job = VALUES(same_as_main_job),
            occupation_code_id = VALUES(occupation_code_id),
            industry_code_id = VALUES(industry_code_id),
            job_status = VALUES(job_status),
            sector = VALUES(sector),
            received_payment = VALUES(received_payment)
    `;
    const values = [
        data.person_round_id, data.worked_past_12mo, data.same_as_main_job,
        data.occupation_code_id || null, data.industry_code_id || null,
        data.job_status, data.sector, data.received_payment
    ];
    const [result] = await connection.query(query, values);
    return result;
}

async function getWorkHistory(connection, personRoundId) {
    const [rows] = await connection.query('SELECT * FROM employment_12month WHERE person_round_id = ?', [personRoundId]);
    return rows[0] || null;
}

async function deleteWorkHistory(connection, personRoundId) {
    await connection.query('DELETE FROM employment_12month WHERE person_round_id = ?', [personRoundId]);
}

// --- UNDEREMPLOYMENT (underemployment) ---
async function upsertUnderemployment(connection, data) {
    const query = `
        INSERT INTO underemployment (
            person_round_id, total_hours_worked, available_more_hours, willing_more_hours,
            wants_different_or_additional_job, sought_job_change, reason_sought_change,
            steps_taken, ready_for_change
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            total_hours_worked = VALUES(total_hours_worked),
            available_more_hours = VALUES(available_more_hours),
            willing_more_hours = VALUES(willing_more_hours),
            wants_different_or_additional_job = VALUES(wants_different_or_additional_job),
            sought_job_change = VALUES(sought_job_change),
            reason_sought_change = VALUES(reason_sought_change),
            steps_taken = VALUES(steps_taken),
            ready_for_change = VALUES(ready_for_change)
    `;
    const values = [
        data.person_round_id, data.total_hours_worked, data.available_more_hours,
        data.willing_more_hours, data.wants_different_or_additional_job,
        data.sought_job_change, data.reason_sought_change, data.steps_taken,
        data.ready_for_change
    ];
    const [result] = await connection.query(query, values);
    return result;
}

async function getUnderemployment(connection, personRoundId) {
    const [rows] = await connection.query('SELECT * FROM underemployment WHERE person_round_id = ?', [personRoundId]);
    return rows[0] || null;
}

async function deleteUnderemployment(connection, personRoundId) {
    await connection.query('DELETE FROM underemployment WHERE person_round_id = ?', [personRoundId]);
}

// --- JOB SEARCH (job_search) ---
async function upsertJobSearch(connection, data) {
    const query = `
        INSERT INTO job_search (
            person_round_id, available_past_7d, made_effort_to_find_work,
            reason_no_effort, method_used, willing_part_time, employment_sought,
            weeks_seeking, occupation_code_id, min_acceptable_wage, min_wage_unit,
            reason_unavailable, conditions_to_accept_work, ever_refused_job,
            reason_refused, reason_not_getting_job
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            available_past_7d = VALUES(available_past_7d),
            made_effort_to_find_work = VALUES(made_effort_to_find_work),
            reason_no_effort = VALUES(reason_no_effort),
            method_used = VALUES(method_used),
            willing_part_time = VALUES(willing_part_time),
            employment_sought = VALUES(employment_sought),
            weeks_seeking = VALUES(weeks_seeking),
            occupation_code_id = VALUES(occupation_code_id),
            min_acceptable_wage = VALUES(min_acceptable_wage),
            min_wage_unit = VALUES(min_wage_unit),
            reason_unavailable = VALUES(reason_unavailable),
            conditions_to_accept_work = VALUES(conditions_to_accept_work),
            ever_refused_job = VALUES(ever_refused_job),
            reason_refused = VALUES(reason_refused),
            reason_not_getting_job = VALUES(reason_not_getting_job)
    `;
    const values = [
        data.person_round_id, data.available_past_7d, data.made_effort_to_find_work,
        data.reason_no_effort, data.method_used, data.willing_part_time,
        data.employment_sought, data.weeks_seeking, data.occupation_code_id || null,
        data.min_acceptable_wage, data.min_wage_unit, data.reason_unavailable,
        data.conditions_to_accept_work, data.ever_refused_job, data.reason_refused,
        data.reason_not_getting_job
    ];
    const [result] = await connection.query(query, values);
    return result;
}

async function getJobSearch(connection, personRoundId) {
    const [rows] = await connection.query('SELECT * FROM job_search WHERE person_round_id = ?', [personRoundId]);
    return rows[0] || null;
}

async function deleteJobSearch(connection, personRoundId) {
    await connection.query('DELETE FROM job_search WHERE person_round_id = ?', [personRoundId]);
}

// --- WORKPLACE SAFETY (workplace_safety & person_round_workplace_condition) ---
async function upsertWorkplaceSafety(connection, data) {
    const query = `
        INSERT INTO workplace_safety (
            person_round_id, had_work_injury_illness, work_stopped_due_to_injury,
            has_safety_officer, safety_officer_accredited, aware_of_labour_rights
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            had_work_injury_illness = VALUES(had_work_injury_illness),
            work_stopped_due_to_injury = VALUES(work_stopped_due_to_injury),
            has_safety_officer = VALUES(has_safety_officer),
            safety_officer_accredited = VALUES(safety_officer_accredited),
            aware_of_labour_rights = VALUES(aware_of_labour_rights)
    `;
    const values = [
        data.person_round_id, data.had_work_injury_illness, data.work_stopped_due_to_injury,
        data.has_safety_officer, data.safety_officer_accredited, data.aware_of_labour_rights
    ];
    const [result] = await connection.query(query, values);
    return result;
}

async function createWorkplaceCondition(connection, personRoundId, conditionId) {
    const query = `INSERT IGNORE INTO person_round_workplace_condition (person_round_id, condition_id) VALUES (?, ?)`;
    const [result] = await connection.query(query, [personRoundId, conditionId]);
    return result;
}

async function getWorkplaceSafetyWithConditions(connection, personRoundId) {
    const [safety] = await connection.query('SELECT * FROM workplace_safety WHERE person_round_id = ?', [personRoundId]);
    const [conditions] = await connection.query(
        'SELECT condition_id FROM person_round_workplace_condition WHERE person_round_id = ?',
        [personRoundId]
    );
    const conditionIds = conditions.map(c => c.condition_id);
    return { ...(safety[0] || {}), condition_ids: conditionIds };
}

async function deleteWorkplaceSafety(connection, personRoundId) {
    await connection.query('DELETE FROM person_round_workplace_condition WHERE person_round_id = ?', [personRoundId]);
    await connection.query('DELETE FROM workplace_safety WHERE person_round_id = ?', [personRoundId]);
}

module.exports = {
    createEmploymentCurrent,
    createPersonRoundActivity,
    createActivityDay,
    getSecondaryJobByPersonRoundId,
    getSecondaryJobDaysByPersonRoundId,
    upsertSecondaryJob,
    deleteSecondaryJobByPersonRoundId,
    upsertWorkHistory, getWorkHistory, deleteWorkHistory,
    upsertUnderemployment, getUnderemployment, deleteUnderemployment,
    upsertJobSearch, getJobSearch, deleteJobSearch,
    upsertWorkplaceSafety, createWorkplaceCondition, getWorkplaceSafetyWithConditions, deleteWorkplaceSafety
};