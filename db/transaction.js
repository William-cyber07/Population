const pool = require('./pool')

async function withTransaction(callback) {
  const connection = await pool.getConnection()
  await connection.beginTransaction()
  try {
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    await connection.release()
  }
}

module.exports = withTransaction;