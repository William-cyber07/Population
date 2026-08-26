// repositories/lookupRepository.js

/**
 * Fetches all records from any lookup table.
 */
async function getAllLookups(connection, tableName) {
    const query = `SELECT * FROM ??`;
    const [rows] = await connection.query(query, [tableName]);
    return rows;
}

/**
 * Fetches a single record by ID from any lookup table.
 */
async function getLookupById(connection, tableName, id, idColumn = 'id') {
    const query = `SELECT * FROM ?? WHERE ?? = ?`;
    const [rows] = await connection.query(query, [tableName, idColumn, id]);
    return rows[0] || null;
}

/**
 * Creates a new record in any lookup table.
 */
async function createLookup(connection, tableName, data) {
    // 1. Get the keys and values
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    // 2. Build the column string: `column1, column2`
    const columns = keys.join(', ');
    // 3. Build the placeholder string: `?, ?`
    const placeholders = keys.map(() => '?').join(', ');
    
    // 4. Build the final query
    const query = `INSERT INTO ?? (${columns}) VALUES (${placeholders})`;
    
    // 5. Execute the query (tableName is first, followed by the values)
    const [result] = await connection.query(query, [tableName, ...values]);
    
    return result;
}

/**
 * Updates a record in any lookup table.
 */
async function updateLookup(connection, tableName, id, data, idColumn = 'id') {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `?? = ?`).join(', ');
    
    const query = `UPDATE ?? SET ${setClause} WHERE ?? = ?`;
    
    const params = [tableName];
    keys.forEach(key => params.push(key));
    values.forEach(val => params.push(val));
    params.push(idColumn, id);

    const [result] = await connection.query(query, params);
    return result;
}

/**
 * Deletes a record from any lookup table.
 */
async function deleteLookup(connection, tableName, id, idColumn = 'id') {
    const query = `DELETE FROM ?? WHERE ?? = ?`;
    const [result] = await connection.query(query, [tableName, idColumn, id]);
    return result;
}

module.exports = {
    getAllLookups,
    getLookupById,
    createLookup,
    updateLookup,
    deleteLookup
};