// services/healthService.js
const withTransaction = require('../db/transaction');
const healthRepo = require('../repositories/healthRepository');

async function saveHealthRecord(healthData) {
    return withTransaction(async (connection) => {
        const personRoundId = healthData.person_round_id;

        await healthRepo.createHealthEpisode(connection, healthData);

        if (healthData.health_insurance) {
            
            await healthRepo.createHealthInsurance(connection, {
                person_round_id: personRoundId,
                ...healthData.health_insurance
            });
        }

        if (healthData.disability) {
            await healthRepo.createDisability(connection, {
                person_round_id: personRoundId,
                ...healthData.disability
            });
        }

        return { message: 'Health record saved successfully', person_round_id: personRoundId };
    });
}

module.exports = {
    saveHealthRecord
};