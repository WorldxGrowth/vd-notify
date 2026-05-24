const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('./db');
const logger = require('./logger');

// Gmail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'diamondvistara@gmail.com',
        pass: 'benq wqko darv yniq',
    }
});

function generateEventId() {
    return 'whevt_' + crypto.randomBytes(10).toString('hex');
}

function signPayload(body, signingKey) {
    return crypto.createHmac('sha256', signingKey).update(JSON.stringify(body)).digest('hex');
}

async function deductCredit(userId, webhookUuid, eventId) {
    try {
        const res = await db.query(`
            UPDATE users SET credit_balance = credit_balance - 1, updated_at = NOW()
            WHERE id = $1 AND credit_balance > 0 RETURNING credit_balance
        `, [userId]);
        if (res.rows.length === 0) return false;
        await db.query(`
            INSERT INTO credit_transactions (user_id, type, amount, balance, description, webhook_id)
            VALUES ($1, 'usage_deduct', -1, $2, $3, $4)
        `, [userId, res.rows[0].credit_balance, `Notification: ${eventId}`, webhookUuid]);
        return true;
    } catch (e) {
        logger.error(`Credit deduct error: ${e.message}`);
        return false;
    }
}

async function updateStats(webhookUuid, userId, success, httpStatus) {
    const today = new Date().toISOString().split('T')[0];
    try {
        await db.query(`
            UPDATE webhooks SET
                total_fired = total_fired + 1,
                total_success = total_success + $1,
                total_failed = total_failed + $2,
                last_fired_at = NOW(), updated_at = NOW()
            WHERE id = $3
        `, [success ? 1 : 0, success ? 0 : 1, webhookUuid]);

        const col4xx = (httpStatus >= 400 && httpStatus < 500) ? 1 : 0;
        const col5xx = (httpStatus >= 500) ? 1 : 0;
        const colSuccess = (httpStatus === 200) ? 1 : 0;

        await db.query(`
            INSERT INTO webhook_daily_stats (webhook_id, date, total_fired, success_200, error_4xx, error_5xx, credits_used)
            VALUES ($1, $2, 1, $3, $4, $5, 1)
            ON CONFLICT (webhook_id, date) DO UPDATE SET
                total_fired  = webhook_daily_stats.total_fired + 1,
                success_200  = webhook_daily_stats.success_200 + $3,
                error_4xx    = webhook_daily_stats.error_4xx + $4,
                error_5xx    = webhook_daily_stats.error_5xx + $5,
                credits_used = webhook_daily_stats.credits_used + 1
        `, [webhookUuid, today, colSuccess, col4xx, col5xx]);

        await db.query(`
            INSERT INTO user_daily_stats (user_id, date, total_fired, total_success, total_failed, credits_used)
            VALUES ($1, $2, 1, $3, $4, 1)
            ON CONFLICT (user_id, date) DO UPDATE SET
                total_fired   = user_daily_stats.total_fired + 1,
                total_success = user_daily_stats.total_success + $3,
                total_failed  = user_daily_stats.total_failed + $4,
                credits_used  = user_daily_stats.credits_used + 1
        `, [userId, today, success ? 1 : 0, success ? 0 : 1]);
    } catch (e) {
        logger.error(`Stats error: ${e.message}`);
    }
}

function buildEmailHtml(activity, webhookName) {
    const a = activity;
    const isToken = a.category === 'token';
    const shortHash = a.hash ? a.hash.substring(0,10)+'...'+a.hash.slice(-6) : '-';
    const shortFrom = a.fromAddress ? a.fromAddress.substring(0,8)+'...'+a.fromAddress.slice(-6) : '-';
    const shortTo   = a.toAddress   ? a.toAddress.substring(0,8)+'...'+a.toAddress.slice(-6)   : '-';
    const blockNum  = a.blockNum ? parseInt(a.blockNum,16).toLocaleString() : '-';
    const asset     = isToken ? 'Token' : (a.asset || 'VDC');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111118;border-radius:16px;border:1px solid #1e1e2e;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;text-align:center;">
  <div style="font-size:32px;margin-bottom:8px;">🔔</div>
  <div style="color:white;font-size:20px;font-weight:700;">Transaction Alert</div>
  <div style="color:#c7d2fe;font-size:13px;margin-top:4px;">${webhookName} • VDChain Mainnet</div>
</td></tr>
<tr><td style="padding:20px 32px 0;text-align:center;">
  <span style="background:${isToken?'#f59e0b20':'#6366f120'};color:${isToken?'#f59e0b':'#818cf8'};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;">
    ${isToken ? '🪙 TOKEN TRANSFER' : '⚡ NATIVE TRANSFER'}
  </span>
</td></tr>
<tr><td style="padding:16px 32px;text-align:center;">
  <div style="font-size:38px;font-weight:800;color:white;">${a.value || '0'}</div>
  <div style="font-size:14px;color:#818cf8;margin-top:4px;">${asset}</div>
</td></tr>
<tr><td style="padding:0 32px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#16161f;border-radius:10px;">
    <tr><td style="padding:10px 16px;color:#64748b;font-size:12px;width:80px;">From</td><td style="padding:10px 16px;color:#e2e8f0;font-size:12px;font-family:monospace;border-left:1px solid #1e1e2e;">${shortFrom}</td></tr>
    <tr><td style="padding:10px 16px;color:#64748b;font-size:12px;">To</td><td style="padding:10px 16px;color:#e2e8f0;font-size:12px;font-family:monospace;border-left:1px solid #1e1e2e;">${shortTo}</td></tr>
    <tr><td style="padding:10px 16px;color:#64748b;font-size:12px;">TX Hash</td><td style="padding:10px 16px;color:#e2e8f0;font-size:12px;font-family:monospace;border-left:1px solid #1e1e2e;">${shortHash}</td></tr>
    <tr><td style="padding:10px 16px;color:#64748b;font-size:12px;">Block</td><td style="padding:10px 16px;color:#e2e8f0;font-size:12px;border-left:1px solid #1e1e2e;">#${blockNum}</td></tr>
    <tr><td style="padding:10px 16px;color:#64748b;font-size:12px;">Status</td><td style="padding:10px 16px;color:#10b981;font-size:12px;border-left:1px solid #1e1e2e;">✅ Confirmed</td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 32px 28px;text-align:center;">
  <a href="https://vdscan.io/tx/${a.hash}" style="display:inline-block;background:#6366f1;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">View on VDScan →</a>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #1e1e2e;text-align:center;">
  <div style="color:#334155;font-size:11px;">Sent by VDNotify • Unsubscribe from your dashboard</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function fireWebhook(webhook, payload) {
    const eventId = generateEventId();
    const activity = payload.event?.activity?.[0];

    const credited = await deductCredit(webhook.user_id, webhook.webhook_uuid, eventId);
    if (!credited) {
        logger.warn(`No credits: ${webhook.webhook_id}`);
        return;
    }

    // Email notification
    if (webhook.notification_type === 'email') {
        const emails = webhook.email_addresses || [];
        if (emails.length === 0) return;

        let success = false;
        try {
            const subject = `🔔 VDChain Alert — ${activity?.value || '0'} ${activity?.asset || 'VDC'} ${activity?.category === 'token' ? 'Token Transfer' : 'Transferred'}`;
            const html = buildEmailHtml(activity || {}, webhook.name || 'VDNotify');

            await Promise.allSettled(emails.map(email =>
                transporter.sendMail({
                    from: 'VDNotify <diamondvistara@gmail.com>',
                    to: email,
                    subject,
                    html,
                })
            ));
            success = true;
            logger.info(`📧 Email sent: ${webhook.webhook_id} → ${emails.length} recipients`);
        } catch(e) {
            logger.warn(`📧 Email failed: ${e.message}`);
        }

        await db.query(`
            INSERT INTO notification_log
                (webhook_id, event_id, tx_hash, block_number, event_type, payload, status, http_status, attempt_count)
            VALUES ($1,$2,$3,$4,$5,$6,$7,200,1)
        `, [
            webhook.webhook_uuid, eventId,
            activity?.hash || null,
            activity?.blockNum ? parseInt(activity.blockNum, 16) : null,
            'ADDRESS_ACTIVITY', JSON.stringify(payload),
            success ? 'delivered' : 'failed'
        ]);

        await updateStats(webhook.webhook_uuid, webhook.user_id, success, success ? 200 : 500);
        return;
    }

    // HTTP Webhook (default)
    const signature = signPayload(payload, webhook.signing_key);

    await db.query(`
        INSERT INTO notification_log
            (webhook_id, event_id, tx_hash, block_number, event_type, payload, status, attempt_count)
        VALUES ($1,$2,$3,$4,$5,$6,'pending',1)
    `, [
        webhook.webhook_uuid, eventId,
        activity?.hash || null,
        activity?.blockNum ? parseInt(activity.blockNum, 16) : null,
        'ADDRESS_ACTIVITY', JSON.stringify(payload)
    ]);

    let httpStatus = 0, responseBody = '', success = false;
    try {
        const res = await axios.post(webhook.url, payload, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'X-VDNotify-Signature': signature,
                'X-VDNotify-Webhook-Id': webhook.webhook_id,
            }
        });
        httpStatus = res.status;
        responseBody = typeof res.data === 'string' ? res.data.substring(0,500) : JSON.stringify(res.data).substring(0,500);
        success = httpStatus === 200;
        logger.info(`✅ Webhook: ${webhook.webhook_id} → ${httpStatus}`);
    } catch(e) {
        httpStatus = e.response?.status || 0;
        responseBody = e.message.substring(0,500);
        logger.warn(`❌ Webhook: ${webhook.webhook_id} → ${e.message}`);
    }

    await db.query(`
        UPDATE notification_log SET status=$1, http_status=$2, response_body=$3, delivered_at=$4
        WHERE event_id=$5
    `, [success?'delivered':'failed', httpStatus, responseBody, success?new Date():null, eventId]);

    await updateStats(webhook.webhook_uuid, webhook.user_id, success, httpStatus);
}

module.exports = { fireWebhook };
