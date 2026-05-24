const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    ...config.db,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
});

pool.on('error', (err) => {
    console.error('DB Pool Error:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
