const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// GET /api/auth/google — redirect to Google
router.get('/', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/callback
router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.redirect(`${process.env.FRONTEND_URL || 'http://vdnotify.vdscan.io'}/login?error=no_code`);

        // Code → tokens exchange
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code',
            })
        });
        const tokens = await tokenRes.json();
        if (!tokens.id_token) return res.redirect(`${process.env.FRONTEND_URL || 'http://vdnotify.vdscan.io'}/login?error=token_failed`);

        // ID token verify
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // User find or create
        let userRes = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

        if (userRes.rows.length === 0) {
            // Email se existing check karo
            const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (emailCheck.rows.length > 0) {
                // Existing user — google_id link karo
                await db.query('UPDATE users SET google_id = $1 WHERE email = $2', [googleId, email]);
                userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            } else {
                // Naya user banao
                const crypto = require('crypto');
                const randomPass = crypto.randomBytes(32).toString('hex');
                const bcrypt = require('bcryptjs');
                const hash = await bcrypt.hash(randomPass, 10);

                userRes = await db.query(`
                    INSERT INTO users (email, password_hash, full_name, google_id, is_verified)
                    VALUES ($1, $2, $3, $4, true)
                    RETURNING *
                `, [email, hash, name || email.split('@')[0], googleId]);

                // Welcome credits log
                await db.query(`
                    INSERT INTO credit_transactions (user_id, type, amount, balance, description)
                    VALUES ($1, 'free_grant', 500, 500, 'Welcome bonus — Google signup')
                `, [userRes.rows[0].id]);
            }
        }

        const user = userRes.rows[0];
        await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

        // Frontend pe redirect with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://vdnotify.vdscan.io';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}&name=${encodeURIComponent(user.full_name || '')}&email=${encodeURIComponent(user.email)}&credits=${user.credit_balance}`);

    } catch(e) {
        console.error('Google OAuth error:', e.message);
        res.redirect(`${process.env.FRONTEND_URL || 'http://vdnotify.vdscan.io'}/login?error=oauth_failed`);
    }
});

module.exports = router;
