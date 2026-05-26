const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const db = require('../db');
const { flexAuth } = require('../middleware/auth');
const { sendPaymentConfirmationEmail } = require('../mailer');

const RAZ_PUBLIC_KEY = process.env.RAZ_PUBLIC_KEY;
const RAZ_SECRET_KEY = process.env.RAZ_SECRET_KEY;
const RAZ_WEBHOOK_SECRET = process.env.RAZ_WEBHOOK_SECRET;

const VDC_PRICE_USD = 0.50; // 1 VDC = $0.50 hardcoded (update when price API available)

const CREDIT_PLANS = [
    { id: 'starter', credits: 10000,  amount: 1.20,  label: 'Starter' },
    { id: 'growth',  credits: 50000,  amount: 3.60,  label: 'Growth'  },
    { id: 'scale',   credits: 200000, amount: 12.00, label: 'Scale'   },
];

// Helper — add credits + log + email
const processCompletedPayment = async (order, txHash, paymentId) => {
    await db.query(`
        UPDATE payment_orders SET status='completed', tx_hash=$1, completed_at=NOW()
        WHERE payment_id=$2
    `, [txHash || null, paymentId]);

    const userRes = await db.query(`
        UPDATE users SET credit_balance = credit_balance + $1, updated_at = NOW()
        WHERE id = $2 RETURNING credit_balance, email, full_name
    `, [order.credits, order.user_id]);

    const userRow = userRes.rows[0];
    const newBalance = userRow?.credit_balance || 0;

    await db.query(`
        INSERT INTO credit_transactions (user_id, type, amount, balance, description, ref_id)
        VALUES ($1, 'purchase', $2, $3, $4, $5)
    `, [
        order.user_id, order.credits, newBalance,
        `Purchased ${Number(order.credits).toLocaleString()} credits via RazCrypto`,
        paymentId
    ]);

    console.log(`✅ Credits added: ${order.credits} → user ${order.user_id} | Balance: ${newBalance}`);

    if (userRow?.email) {
        sendPaymentConfirmationEmail(userRow.email, userRow.full_name, {
            credits: order.credits,
            amount: order.amount,
            paymentId,
            newBalance,
        }).catch(e => console.error('Payment email error:', e.message));
    }

    return newBalance;
};

// POST /api/payments/create
router.post('/create', flexAuth, async (req, res) => {
    try {
        const { plan_id, currency = 'USDT' } = req.body;
        const plan = CREDIT_PLANS.find(p => p.id === plan_id);
        if (!plan) return res.status(400).json({ error: 'Invalid plan' });

        // VDC ya USDT
        const useVDC = currency === 'VDC';
        const payAmount = useVDC
            ? parseFloat((plan.amount / VDC_PRICE_USD).toFixed(6))
            : plan.amount;
        const payChain    = useVDC ? 'VDCHAIN' : 'BSC';
        const payCurrency = useVDC ? 'VDC'     : 'USDT';

        const callbackUrl = 'https://vdnotify.vdscan.io/api/payments/webhook';

        const razRes = await axios.post('https://razcryptogateway.com/api/v2/payments/create', {
            amount: payAmount,
            email: req.user.email,
            callback_url: callbackUrl,
            chain: payChain,
            currency: payCurrency,
            return_json: 'true',
            custom_data: {
                user_id: req.user.id,
                plan_id: plan.id,
                credits: plan.credits,
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Public-Key-Id': RAZ_PUBLIC_KEY,
                'Accept': 'application/json',
            }
        });

        const data = razRes.data;
        if (data.status !== 'success') return res.status(400).json({ error: 'Payment creation failed' });

        const existing = await db.query(
            'SELECT id FROM payment_orders WHERE payment_id = $1', [data.payment_id]
        );
        if (existing.rows.length === 0) {
            await db.query(`
                INSERT INTO payment_orders (user_id, payment_id, credits, amount, status, razcrypto_response)
                VALUES ($1, $2, $3, $4, 'pending', $5)
            `, [req.user.id, data.payment_id, plan.credits, plan.amount, JSON.stringify(data)]);
        }

        res.json({
            success: true,
            payment_id: data.payment_id,
            checkout_page: data.checkout_page,
            hosted_page: data.hosted_page,
            address: data.address,
            amount: data.amount,
            qr_code: data.qr_code,
            currency: data.currency,
            chain: data.chain,
            expiry_minutes: data.expiry_minutes,
        });

    } catch(e) {
        console.error('Payment create error:', e.message);
        res.status(500).json({ error: 'Payment creation failed: ' + e.message });
    }
});

// GET /api/payments/check/:payment_id
router.get('/check/:payment_id', flexAuth, async (req, res) => {
    try {
        const { payment_id } = req.params;

        const razRes = await axios.get(
            `https://razcryptogateway.com/api/v1/payments/status/${payment_id}`
        );
        const razData = razRes.data;

        if (razData.status === 'completed') {
            const orderRes = await db.query(
                'SELECT * FROM payment_orders WHERE payment_id = $1 AND user_id = $2',
                [payment_id, req.user.id]
            );

            if (orderRes.rows.length > 0 && orderRes.rows[0].status !== 'completed') {
                await processCompletedPayment(orderRes.rows[0], razData.tx_hash, payment_id);
            }
        }

        res.json({ success: true, status: razData.status, tx_hash: razData.tx_hash || null });

    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/payments/status/:payment_id
router.get('/status/:payment_id', flexAuth, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM payment_orders WHERE payment_id = $1 AND user_id = $2',
            [req.params.payment_id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        res.json({ success: true, order: result.rows[0] });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/payments/history
router.get('/history', flexAuth, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, payment_id, credits, amount, status, tx_hash, created_at, completed_at
             FROM payment_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
            [req.user.id]
        );
        res.json({ success: true, orders: result.rows });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/payments/webhook — RazCrypto callback
router.post('/webhook', async (req, res) => {
    try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
        const signature = req.headers['x-razcrypto-signature'] || '';

        console.log('Webhook received | sig:', signature ? 'present' : 'missing');

        const expected = crypto.createHmac('sha256', RAZ_WEBHOOK_SECRET)
            .update(rawBody, 'utf8').digest('hex');

        if (expected !== signature) {
            console.error('❌ Webhook signature mismatch');
        } else {
            console.log('✅ Webhook signature valid');
        }

        const payload = Buffer.isBuffer(req.body) || typeof req.body === 'string'
            ? JSON.parse(rawBody)
            : req.body;

        console.log('Webhook event:', payload.event, '| payment_id:', payload.payment_id);

        if (payload.event === 'payment.completed' && payload.status === 'success') {
            const paymentId = payload.payment_id;
            const txHash    = payload.tx_hash;

            const orderRes = await db.query(
                'SELECT * FROM payment_orders WHERE payment_id = $1', [paymentId]
            );

            if (orderRes.rows.length === 0) {
                console.error('Webhook: order not found:', paymentId);
                return res.status(200).json({ received: true });
            }

            const order = orderRes.rows[0];
            if (order.status === 'completed') {
                console.log('Webhook: already processed:', paymentId);
                return res.status(200).json({ received: true, note: 'Already processed' });
            }

            await processCompletedPayment(order, txHash, paymentId);
        }

        res.status(200).json({ received: true });

    } catch(e) {
        console.error('Webhook error:', e.message);
        res.status(200).json({ received: true });
    }
});

module.exports = router;
module.exports.CREDIT_PLANS = CREDIT_PLANS;
