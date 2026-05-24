const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { flexAuth } = require('../middleware/auth');

// GET /api/webhooks
router.get('/', flexAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT w.*, n.display_name as network_name,
                   COUNT(wa.id) as address_count
            FROM webhooks w
            JOIN networks n ON n.id = w.network_id
            LEFT JOIN webhook_addresses wa ON wa.webhook_id = w.id AND wa.is_active = true
            WHERE w.user_id = $1
            GROUP BY w.id, n.display_name
            ORDER BY w.created_at DESC
        `, [req.user.id]);
        res.json({ success: true, webhooks: result.rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/webhooks
router.post('/', flexAuth, async (req, res) => {
    try {
        const { name, url, type, notification_type, email_addresses } = req.body;

        const nType = notification_type || 'webhook';
        if (nType === 'webhook' && !url) return res.status(400).json({ error: 'Webhook URL required' });
        if (nType === 'email' && (!email_addresses || email_addresses.length === 0))
            return res.status(400).json({ error: 'At least one email required' });

        // Plan limit check
        const countRes = await db.query('SELECT COUNT(*) FROM webhooks WHERE user_id = $1', [req.user.id]);
        const planRes  = await db.query('SELECT max_webhooks FROM plans WHERE id = $1', [req.user.plan_id]);
        if (parseInt(countRes.rows[0].count) >= planRes.rows[0].max_webhooks)
            return res.status(400).json({ error: `Plan limit reached` });

        const result = await db.query(`
            INSERT INTO webhooks (user_id, name, url, type, webhook_id, notification_type, email_addresses)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            req.user.id,
            name || 'My Webhook',
            url || '',
            type || 'ADDRESS_ACTIVITY',
            'wh_' + crypto.randomBytes(10).toString('hex'),
            nType,
            JSON.stringify(email_addresses || []),
        ]);

        res.status(201).json({ success: true, webhook: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/webhooks/:id
router.get('/:id', flexAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT w.*, n.display_name as network_name,
                   COUNT(wa.id) as address_count
            FROM webhooks w
            JOIN networks n ON n.id = w.network_id
            LEFT JOIN webhook_addresses wa ON wa.webhook_id = w.id AND wa.is_active = true
            WHERE w.id = $1 AND w.user_id = $2
            GROUP BY w.id, n.display_name
        `, [req.params.id, req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
        res.json({ success: true, webhook: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/webhooks/:id
router.put('/:id', flexAuth, async (req, res) => {
    try {
        const { name, url, status, notification_type, email_addresses } = req.body;
        const result = await db.query(`
            UPDATE webhooks SET
                name = COALESCE($1, name),
                url = COALESCE($2, url),
                status = COALESCE($3, status),
                notification_type = COALESCE($4, notification_type),
                email_addresses = COALESCE($5, email_addresses),
                updated_at = NOW()
            WHERE id = $6 AND user_id = $7
            RETURNING *
        `, [name, url, status, notification_type,
            email_addresses ? JSON.stringify(email_addresses) : null,
            req.params.id, req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
        res.json({ success: true, webhook: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/webhooks/:id
router.delete('/:id', flexAuth, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM webhooks WHERE id = $1 AND user_id = $2 RETURNING id',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });
        res.json({ success: true, message: 'Webhook deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PATCH /api/webhooks/:id/addresses
router.patch('/:id/addresses', flexAuth, async (req, res) => {
    try {
        const { addresses_to_add = [], addresses_to_remove = [] } = req.body;
        const webhook = await db.query(
            'SELECT * FROM webhooks WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        if (webhook.rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });

        for (const addr of addresses_to_add) {
            await db.query(`
                INSERT INTO webhook_addresses (webhook_id, address)
                VALUES ($1, $2)
                ON CONFLICT (webhook_id, LOWER(address)) DO UPDATE SET is_active = true
            `, [req.params.id, addr.toLowerCase()]);
        }
        for (const addr of addresses_to_remove) {
            await db.query(`
                UPDATE webhook_addresses SET is_active = false
                WHERE webhook_id = $1 AND LOWER(address) = $2
            `, [req.params.id, addr.toLowerCase()]);
        }

        const countRes = await db.query(
            'SELECT COUNT(*) FROM webhook_addresses WHERE webhook_id = $1 AND is_active = true',
            [req.params.id]
        );
        res.json({ success: true, total_addresses: parseInt(countRes.rows[0].count) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/webhooks/:id/addresses
router.get('/:id/addresses', flexAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT address, label, added_at FROM webhook_addresses
            WHERE webhook_id = $1 AND is_active = true ORDER BY added_at DESC
        `, [req.params.id]);
        res.json({ success: true, addresses: result.rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/webhooks/:id/logs
router.get('/:id/logs', flexAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const result = await db.query(`
            SELECT event_id, tx_hash, block_number, event_type,
                   status, http_status, attempt_count, delivered_at, created_at
            FROM notification_log WHERE webhook_id = $1
            ORDER BY created_at DESC LIMIT $2
        `, [req.params.id, limit]);
        res.json({ success: true, logs: result.rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
