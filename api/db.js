const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    ...config.db,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
