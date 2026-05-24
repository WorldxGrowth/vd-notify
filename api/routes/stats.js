const express = require('express');
const router = express.Router();
const db = require('../db');
const { flexAuth } = require('../middleware/auth');

// GET /api/stats/overview
router.get('/overview', flexAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const today = await db.query(`
            SELECT COALESCE(SUM(total_fired),0) as fired,
                   COALESCE(SUM(total_success),0) as success,
                   COALESCE(SUM(total_failed),0) as failed,
                   COALESCE(SUM(credits_used),0) as credits
            FROM user_daily_stats
            WHERE user_id = $1 AND date = CURRENT_DATE
        `, [userId]);

        const last7 = await db.query(`
            SELECT date, total_fired, total_success, total_failed, credits_used
            FROM user_daily_stats
            WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY date ASC
        `, [userId]);

        const last30 = await db.query(`
            SELECT COALESCE(SUM(total_fired),0) as fired,
                   COALESCE(SUM(credits_used),0) as credits
            FROM user_daily_stats
            WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
        `, [userId]);

        const webhookCount = await db.query(
            'SELECT COUNT(*) FROM webhooks WHERE user_id = $1', [userId]
        );

        res.json({
            success: true,
            today: today.rows[0],
            last7days: last7.rows,
            last30days: last30.rows[0],
            webhook_count: parseInt(webhookCount.rows[0].count),
            credit_balance: req.user.credit_balance,
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/stats/webhook/:id
router.get('/webhook/:id', flexAuth, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT date, total_fired, success_200, error_4xx, error_5xx, error_timeout, credits_used
            FROM webhook_daily_stats
            WHERE webhook_id = $1
            ORDER BY date DESC
            LIMIT 30
        `, [req.params.id]);
        res.json({ success: true, stats: result.rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
