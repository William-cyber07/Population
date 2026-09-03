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

async function createLookup(connection, tableName, data) {
    // 1. Manually extract keys and values
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // 2. Generate the placeholders (?, ?, ?)
    const placeholders = keys.map(() => '?').join(', ');
    
    // 3. Build the query: INSERT INTO table (key1, key2) VALUES (?, ?)
    const query = `INSERT INTO ?? (${keys.map(() => '??').join(', ')}) VALUES (${placeholders})`;
    
    // 4. Build the parameter array: [tableName, key1, key2, value1, value2]
    const params = [tableName];
    keys.forEach(key => params.push(key));
    values.forEach(val => params.push(val));

    const [result] = await connection.query(query, params);
    return result;
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