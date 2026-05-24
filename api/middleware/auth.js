const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

// JWT Token verify
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) return res.status(401).json({ error: 'Token required' });

        const decoded = jwt.verify(token, config.jwtSecret);
        const result = await db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);

        if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });

        req.user = result.rows[0];
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// API Key verify (X-API-Key header)
const apiKeyMiddleware = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) return res.status(401).json({ error: 'API key required' });

        const result = await db.query('SELECT * FROM users WHERE api_key = $1 AND is_active = true', [apiKey]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid API key' });

        req.user = result.rows[0];
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Auth error' });
    }
};

// JWT ya API Key — dono accept karo
const flexAuth = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) return apiKeyMiddleware(req, res, next);
    return authMiddleware(req, res, next);
};

module.exports = { authMiddleware, apiKeyMiddleware, flexAuth };
