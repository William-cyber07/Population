// db/pool.js
const fs = require('fs');
const mysql = require('mysql2');
require('dotenv').config();

// TLS is opt-in so local development against a plain MySQL server keeps
// working. Set DB_SSL=true (and optionally DB_SSL_CA=/path/to/ca.pem) in
// production.
const sslEnabled = process.env.DB_SSL === 'true';
let ssl;
if (sslEnabled) {
  ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  };
  if (process.env.DB_SSL_CA) {
    ssl.ca = fs.readFileSync(process.env.DB_SSL_CA);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// The crucial part: we MUST export the promise-compatible pool
module.exports = pool.promise();
