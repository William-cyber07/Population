// services/lookupService.js
const withTransaction = require('../db/transaction');
const repo = require('../repositories/lookupRepository');

// Helper to get the correct ID column name for specific tables
function getIdColumn(tableName) {
    if (tableName === 'region') return 'region_id';
    if (tableName === 'district') return 'district_id';
    if (tableName === 'relationship_to_head') return 'relationship_id';
    if (tableName === 'marital_status') return 'status_id';
    if (tableName === 'education_level') return 'level_id';
    if (tableName === 'activity_type') return 'activity_type_id';
    if (tableName === 'expense_item') return 'expense_item_id';
    if (tableName === 'tool_equipment') return 'tool_id';
    if (tableName === 'workplace_condition_item') return 'condition_id';
    return 'id'; // Default fallback
}

async function getAllLookupRecords(tableName) {
    return withTransaction(async (connection) => {
        return await repo.getAllLookups(connection, tableName);
    });
}

async function getSingleLookupRecord(tableName, id) {
    return withTransaction(async (connection) => {
        const idCol = getIdColumn(tableName);
        return await repo.getLookupById(connection, tableName, id, idCol);
    });
}

async function createLookupRecord(tableName, data) {
    return withTransaction(async (connection) => {
        return await repo.createLookup(connection, tableName, data);
    });
}

async function updateLookupRecord(tableName, id, data) {
    return withTransaction(async (connection) => {
        const idCol = getIdColumn(tableName);
        return await repo.updateLookup(connection, tableName, id, data, idCol);
    });
}

async function deleteLookupRecord(tableName, id) {
    return withTransaction(async (connection) => {
        const idCol = getIdColumn(tableName);
        return await repo.deleteLookup(connection, tableName, id, idCol);
    });
}

module.exports = {
    getAllLookupRecords,
    getSingleLookupRecord,
    createLookupRecord,
    updateLookupRecord,
    deleteLookupRecord
};