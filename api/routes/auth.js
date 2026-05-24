const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { authMiddleware } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../mailer');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        if (password.length < 6) return res.status(400).json({ error: 'Password min 6 characters' });

        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);
        const result = await db.query(`
            INSERT INTO users (email, password_hash, full_name)
            VALUES ($1, $2, $3)
            RETURNING id, email, full_name, api_key, credit_balance, created_at
        `, [email.toLowerCase(), hash, full_name || null]);

        const user = result.rows[0];

        // Free grant credit log
        await db.query(`
            INSERT INTO credit_transactions (user_id, type, amount, balance, description)
            VALUES ($1, 'free_grant', 500, 500, 'Welcome bonus credits')
        `, [user.id]);

        const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

        // Welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.full_name).catch(e => console.error('Welcome email:', e.message));

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                api_key: user.api_key,
                credit_balance: user.credit_balance,
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const result = await db.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                api_key: user.api_key,
                credit_balance: user.credit_balance,
                plan_id: user.plan_id,
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.email, u.full_name, u.api_key, u.credit_balance,
                   u.credits_reset_at, u.created_at, u.last_login_at,
                   p.name as plan_name, p.display_name as plan_display,
                   p.max_webhooks, p.max_addresses, p.monthly_credits
            FROM users u
            JOIN plans p ON p.id = u.plan_id
            WHERE u.id = $1
        `, [req.user.id]);
        res.json({ success: true, user: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
