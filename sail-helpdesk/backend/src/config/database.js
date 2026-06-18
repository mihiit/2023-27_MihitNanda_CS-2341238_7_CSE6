// backend/src/config/database.js
const oracledb = require('oracledb');
const logger = require('../utils/logger');

let pool;

const dbConfig = {
  user: process.env.ORACLE_USER || 'sail_helpdesk',
  password: process.env.ORACLE_PASSWORD || 'SailHelp@2024',
  connectString: process.env.ORACLE_CONNECT_STRING || 'localhost:1521/XEPDB1',
  poolMin: parseInt(process.env.ORACLE_POOL_MIN) || 2,
  poolMax: parseInt(process.env.ORACLE_POOL_MAX) || 10,
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT) || 2,
  poolAlias: 'default',
};

async function initialize() {
  try {
    oracledb.autoCommit = true;
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    pool = await oracledb.createPool(dbConfig);
    logger.info('Oracle DB connection pool created successfully');
  } catch (err) {
    logger.error('Failed to create Oracle DB pool:', err);
    throw err;
  }
}

async function close() {
  if (pool) {
    await pool.close(10);
    logger.info('Oracle DB pool closed');
  }
}

async function execute(sql, params = [], options = {}) {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });
    return result;
  } catch (err) {
    logger.error('DB Execute Error:', { sql: sql.substring(0, 100), err: err.message });
    throw err;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function executeMany(sql, rows, options = {}) {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.executeMany(sql, rows, options);
    return result;
  } finally {
    if (connection) await connection.close();
  }
}

async function getConnection() {
  return await pool.getConnection();
}

module.exports = { initialize, close, execute, executeMany, getConnection };
