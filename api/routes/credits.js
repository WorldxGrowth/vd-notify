const express = require('express');
const router = express.Router();
const db = require('../db');
const { flexAuth } = require('../middleware/auth');

// GET /api/credits
router.get('/', flexAuth, async (req, res) => {
    try {
        const history = await db.query(`
            SELECT type, amount, balance, description, created_at
            FROM credit_transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 20
        `, [req.user.id]);

        res.json({
            success: true,
            credit_balance: req.user.credit_balance,
            credits_reset_at: req.user.credits_reset_at,
            history: history.rows,
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
