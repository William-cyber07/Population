// services/personService.js
const withTransaction = require('../db/transaction');
const personRepo = require('../repositories/personRepository');

/**
 * Performs the sync operation for a specific user.
 */
async function syncSurveysForUser(userId) {
    return withTransaction(async (connection) => {
        const syncedCount = await personRepo.syncUserSurveys(connection, userId);
        return { 
            message: 'Sync completed successfully', 
            synced_count: syncedCount 
        };
    });
}

module.exports = {
    syncSurveysForUser
};