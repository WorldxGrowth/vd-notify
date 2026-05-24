const db = require('./db');
const logger = require('./logger');

let addressMap = new Map();

async function loadAddressMap() {
    try {
        const res = await db.query(`
            SELECT
                wa.address,
                w.id as webhook_uuid,
                w.webhook_id,
                w.url,
                w.signing_key,
                w.type,
                w.status,
                w.retry_count,
                w.notification_type,
                w.email_addresses,
                w.name,
                u.credit_balance,
                u.id as user_id
            FROM webhook_addresses wa
            JOIN webhooks w ON w.id = wa.webhook_id
            JOIN users u ON u.id = w.user_id
            WHERE wa.is_active = true
              AND w.status = 'active'
              AND u.is_active = true
              AND u.credit_balance > 0
        `);

        const newMap = new Map();
        for (const row of res.rows) {
            const addr = row.address.toLowerCase();
            if (!newMap.has(addr)) newMap.set(addr, []);
            newMap.get(addr).push(row);
        }
        addressMap = newMap;
        logger.info(`Address map: ${addressMap.size} addresses, ${res.rows.length} subscriptions`);
    } catch (e) {
        logger.error(`loadAddressMap: ${e.message}`);
    }
}

async function startAutoReload() {
    await loadAddressMap();
    setInterval(loadAddressMap, 30000);
}

function getWebhooksForAddress(address) {
    return addressMap.get(address.toLowerCase()) || [];
}

function getMapSize() { return addressMap.size; }

module.exports = { startAutoReload, getWebhooksForAddress, loadAddressMap, getMapSize };
