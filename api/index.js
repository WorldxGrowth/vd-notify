const express = require('express');
const cors = require('cors');
const config = require('./config');
const { testConnection } = require('./mailer');

const app = express();

app.use(cors({
    origin: '*',
    credentials: false,
}));

// Webhook raw body — must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/auth/google', require('./routes/google'));
app.use('/api/webhooks',    require('./routes/webhooks'));
app.use('/api/stats',       require('./routes/stats'));
app.use('/api/credits',     require('./routes/credits'));
app.use('/api/payments',    require('./routes/payments'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'VDNotify API', time: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'VDNotify API', time: new Date().toISOString() }));

app.listen(config.port, () => {
    console.log(`VDNotify API running on port ${config.port}`);
    testConnection();
});
