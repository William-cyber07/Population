// services/employmentService.js
const withTransaction = require('../db/transaction');
const empRepo = require('../repositories/employmentRepository');

async function saveEmploymentRecord(employmentData) {
    return withTransaction(async (connection) => {
        const personRoundId = employmentData.person_round_id;

        // 1. Insert the main employment_current record
        await empRepo.createEmploymentCurrent(connection, employmentData);

        // 2. If there are activities provided, loop through and insert them
        if (employmentData.activities && employmentData.activities.length > 0) {
            
            for (const activity of employmentData.activities) {
                
                // Insert the activity and get the newly generated ID back
                const newActivityId = await empRepo.createPersonRoundActivity(connection, {
                    person_round_id: personRoundId,
                    activity_type_id: activity.activity_type_id,
                    did_activity: activity.did_activity,
                    days_count: activity.days_count,
                    output_mainly_for_sale: activity.output_mainly_for_sale
                });

                // 3. If there are daily hours for this activity, insert them
                if (activity.days && activity.days.length > 0) {
                    for (const day of activity.days) {
                        await empRepo.createActivityDay(connection, newActivityId, day);
                    }
                }
            }
        }

        return { message: 'Employment record saved successfully', person_round_id: personRoundId };
    });
}


/**
 * Fetches secondary job data and its daily hours.
 */
async function getSecondaryJob(personRoundId) {
    return withTransaction(async (connection) => {
        const jobData = await empRepo.getSecondaryJobByPersonRoundId(connection, personRoundId);
        if (!jobData) return null;
        
        const daysData = await empRepo.getSecondaryJobDaysByPersonRoundId(connection, personRoundId);
        return { ...jobData, days: daysData };
    });
}

/**
 * Creates or Updates a secondary job and its daily hours.
 */
async function upsertSecondaryJobRecord(jobData) {
    return withTransaction(async (connection) => {
        const personRoundId = jobData.person_round_id;

        // 1. Upsert the main secondary job record
        await empRepo.upsertSecondaryJob(connection, jobData);

        // 2. Delete old daily hours so we can safely insert the new ones
        await connection.query('DELETE FROM person_round_secondary_job_dev WHERE person_round_id = ?', [personRoundId]);

        // 3. Insert the new daily hours
        if (jobData.days && jobData.days.length > 0) {
            for (const day of jobData.days) {
                await connection.query(
                    'INSERT INTO person_round_secondary_job_dev (person_round_id, day_number, hours_worked) VALUES (?, ?, ?)',
                    [personRoundId, day.day_number, day.hours_worked]
                );
            }
        }

        return { message: 'Secondary job saved successfully', person_round_id: personRoundId };
    });
}

/**
 * Deletes a secondary job.
 */
async function deleteSecondaryJobRecord(personRoundId) {
    return withTransaction(async (connection) => {
        return await empRepo.deleteSecondaryJobByPersonRoundId(connection, personRoundId);
    });
}

// --- WORK HISTORY ---
async function saveWorkHistoryRecord(data) {
    return withTransaction(async (connection) => {
        await empRepo.upsertWorkHistory(connection, data);
        return { message: 'Work history saved', person_round_id: data.person_round_id };
    });
}
async function getWorkHistoryRecord(personRoundId) {
    return withTransaction(async (connection) => {
        return await empRepo.getWorkHistory(connection, personRoundId);
    });
}
async function deleteWorkHistoryRecord(personRoundId) {
    return withTransaction(async (connection) => {
        await empRepo.deleteWorkHistory(connection, personRoundId);
        return { message: 'Work history deleted' };
    });
}

// --- UNDEREMPLOYMENT ---
async function saveUnderemploymentRecord(data) {
    return withTransaction(async (connection) => {
        await empRepo.upsertUnderemployment(connection, data);
        return { message: 'Underemployment saved', person_round_id: data.person_round_id };
    });
}
async function getUnderemploymentRecord(personRoundId) {
    return withTransaction(async (connection) => {
        return await empRepo.getUnderemployment(connection, personRoundId);
    });
}
async function deleteUnderemploymentRecord(personRoundId) {
    return withTransaction(async (connection) => {
        await empRepo.deleteUnderemployment(connection, personRoundId);
        return { message: 'Underemployment deleted' };
    });
}

// --- JOB SEARCH ---
async function saveJobSearchRecord(data) {
    return withTransaction(async (connection) => {
        await empRepo.upsertJobSearch(connection, data);
        return { message: 'Job search saved', person_round_id: data.person_round_id };
    });
}
async function getJobSearchRecord(personRoundId) {
    return withTransaction(async (connection) => {
        return await empRepo.getJobSearch(connection, personRoundId);
    });
}
async function deleteJobSearchRecord(personRoundId) {
    return withTransaction(async (connection) => {
        await empRepo.deleteJobSearch(connection, personRoundId);
        return { message: 'Job search deleted' };
    });
}

async function saveWorkplaceSafetyRecord(data) {
    return withTransaction(async (connection) => {
        const personRoundId = data.person_round_id;

        // 1. Insert main workplace_safety record
        await empRepo.upsertWorkplaceSafety(connection, data);

        // 2. Delete old conditions to replace with new ones
        await connection.query('DELETE FROM person_round_workplace_condition WHERE person_round_id = ?', [personRoundId]);

        // 3. Insert new conditions
        if (data.condition_ids && data.condition_ids.length > 0) {
            for (const condId of data.condition_ids) {
                await empRepo.createWorkplaceCondition(connection, personRoundId, condId);
            }
        }

        return { message: 'Workplace safety saved', person_round_id: personRoundId };
    });
}
async function getWorkplaceSafetyRecord(personRoundId) {
    return withTransaction(async (connection) => {
        return await empRepo.getWorkplaceSafetyWithConditions(connection, personRoundId);
    });
}
async function deleteWorkplaceSafetyRecord(personRoundId) {
    return withTransaction(async (connection) => {
        await empRepo.deleteWorkplaceSafety(connection, personRoundId);
        return { message: 'Workplace safety deleted' };
    });
}

module.exports = {
    saveEmploymentRecord,
    getSecondaryJob, upsertSecondaryJobRecord, deleteSecondaryJobRecord,
    saveWorkHistoryRecord, getWorkHistoryRecord, deleteWorkHistoryRecord,
    saveUnderemploymentRecord, getUnderemploymentRecord, deleteUnderemploymentRecord,
    saveJobSearchRecord, getJobSearchRecord, deleteJobSearchRecord,
    saveWorkplaceSafetyRecord, getWorkplaceSafetyRecord, deleteWorkplaceSafetyRecord
};