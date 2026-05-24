const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    }
});

const FROM = process.env.GMAIL_FROM || 'VDNotify <diamondvistara@gmail.com>';

const testConnection = async () => {
    try {
        await transporter.verify();
        console.log('Gmail SMTP connected ✅');
    } catch(e) {
        console.error('Gmail SMTP error:', e.message);
    }
};

const sendWelcomeEmail = async (email, name) => {
    try {
        const firstName = name ? name.split(' ')[0] : 'there';
        await transporter.sendMail({
            from: FROM,
            to: email,
            subject: `Welcome to VDNotify! 🎉 Your 500 free credits are ready`,
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e2e8f0}.wrap{max-width:580px;margin:0 auto}.header{background:linear-gradient(135deg,#1a0533 0%,#0d1b6e 50%,#1a3a8f 100%);padding:40px 32px;text-align:center;border-radius:16px 16px 0 0}.body{background:#1a1a2e;padding:32px}.card{background:#0f0f1a;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin:16px 0}.btn{display:block;background:linear-gradient(135deg,#6366f1,#818cf8);color:white;text-decoration:none;text-align:center;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;margin:24px 0}.footer{background:#0a0a15;padding:20px 32px;text-align:center;border-radius:0 0 16px 16px;color:#64748b;font-size:12px}p{color:#94a3b8;line-height:1.7;margin:0 0 12px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a2a3e}.row:last-child{border:none}</style>
</head><body><div class="wrap">
<div class="header">
  <div style="font-size:26px;font-weight:900;color:white">VD<span style="color:#818cf8">Notify</span></div>
  <h1 style="color:white;font-size:26px;font-weight:800;margin:16px 0 6px">Welcome, ${firstName}! 👋</h1>
  <p style="color:rgba(255,255,255,0.65);margin:0;font-size:14px">Your VDChain notification system is ready</p>
</div>
<div class="body">
  <p>Hi <strong style="color:#e2e8f0">${firstName}</strong>,</p>
  <p>Welcome to <strong style="color:#818cf8">VDNotify</strong> — real-time webhook notifications for VDChain blockchain!</p>
  <div style="background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:12px;padding:24px;text-align:center;margin:20px 0">
    <div style="font-size:42px;font-weight:900;color:white">500</div>
    <div style="color:rgba(255,255,255,0.85);font-size:16px;font-weight:600">Free Credits Added! 🎁</div>
    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px">Ready to use · No expiry</div>
  </div>
  <div class="card">
    <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">What You Can Do</div>
    <div style="padding:8px 0;border-bottom:1px solid #2a2a3e"><span style="color:#10b981">✓</span> <span style="color:#cbd5e1;font-size:14px"> Monitor any VDChain wallet in real-time</span></div>
    <div style="padding:8px 0;border-bottom:1px solid #2a2a3e"><span style="color:#10b981">✓</span> <span style="color:#cbd5e1;font-size:14px"> HTTP webhooks with Alchemy-compatible payload</span></div>
    <div style="padding:8px 0;border-bottom:1px solid #2a2a3e"><span style="color:#10b981">✓</span> <span style="color:#cbd5e1;font-size:14px"> Email alerts for every transaction</span></div>
    <div style="padding:8px 0"><span style="color:#10b981">✓</span> <span style="color:#cbd5e1;font-size:14px"> ERC-20 token transfer monitoring</span></div>
  </div>
  <div class="card">
    <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Your Account</div>
    <div class="row"><span style="color:#64748b;font-size:13px">Email</span><span style="color:#e2e8f0;font-size:13px;font-weight:600">${email}</span></div>
    <div class="row"><span style="color:#64748b;font-size:13px">Credits</span><span style="color:#10b981;font-size:13px;font-weight:700">500 credits</span></div>
    <div class="row"><span style="color:#64748b;font-size:13px">Network</span><span style="color:#818cf8;font-size:13px;font-weight:700">VDChain (882022)</span></div>
  </div>
  <a href="https://vdnotify.vdscan.io/dashboard" class="btn">→ Go to Dashboard</a>
  <div style="background:#6366f110;border:1px solid #6366f130;border-radius:10px;padding:14px 16px">
    <div style="font-size:12px;color:#818cf8;font-weight:700;margin-bottom:6px">📚 Quick Start</div>
    <div style="font-size:12px;color:#64748b;line-height:1.8">1. Create a webhook in dashboard<br>2. Add wallet addresses to monitor<br>3. Receive real-time notifications</div>
  </div>
</div>
<div class="footer">
  <p style="margin:0 0 4px">VDNotify · <a href="https://vdnotify.vdscan.io" style="color:#818cf8">vdnotify.vdscan.io</a></p>
  <p style="margin:0">Part of VDChain ecosystem · Chain ID: 882022</p>
</div>
</div></body></html>`
        });
        console.log(`✅ Welcome email sent to ${email}`);
    } catch(e) {
        console.error('Welcome email error:', e.message);
    }
};

const sendPaymentConfirmationEmail = async (email, name, { credits, amount, paymentId, newBalance }) => {
    try {
        const firstName = name ? name.split(' ')[0] : 'there';
        await transporter.sendMail({
            from: FROM,
            to: email,
            subject: `✅ ${Number(credits).toLocaleString()} credits added to your VDNotify account`,
            html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;color:#e2e8f0}.wrap{max-width:580px;margin:0 auto}.header{background:linear-gradient(135deg,#064e3b,#065f46);padding:36px 32px;text-align:center;border-radius:16px 16px 0 0}.body{background:#1a1a2e;padding:32px}.card{background:#0f0f1a;border:1px solid #2a2a3e;border-radius:12px;padding:20px;margin:16px 0}.btn{display:block;background:linear-gradient(135deg,#6366f1,#818cf8);color:white;text-decoration:none;text-align:center;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;margin:24px 0}.footer{background:#0a0a15;padding:20px 32px;text-align:center;border-radius:0 0 16px 16px;color:#64748b;font-size:12px}p{color:#94a3b8;line-height:1.7;margin:0 0 12px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a2a3e}.row:last-child{border:none}</style>
</head><body><div class="wrap">
<div class="header">
  <div style="font-size:52px;margin-bottom:12px">✅</div>
  <div style="font-size:22px;font-weight:900;color:white">Payment Confirmed!</div>
  <div style="color:rgba(255,255,255,0.65);font-size:14px;margin-top:6px">Credits added to your account</div>
</div>
<div class="body">
  <p>Hi <strong style="color:#e2e8f0">${firstName}</strong>,</p>
  <p>Your payment was successful! <strong style="color:#10b981">${Number(credits).toLocaleString()} credits</strong> added to your account.</p>
  <div style="background:#10b98110;border:1px solid #10b98130;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
    <div style="font-size:42px;font-weight:900;color:#10b981">+${Number(credits).toLocaleString()}</div>
    <div style="color:#6ee7b7;font-size:14px;font-weight:600;margin-top:4px">Credits Added Successfully</div>
    <div style="color:#64748b;font-size:12px;margin-top:4px">New Balance: <strong style="color:#818cf8">${Number(newBalance).toLocaleString()} credits</strong></div>
  </div>
  <div class="card">
    <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px">Transaction Details</div>
    <div class="row"><span style="color:#64748b;font-size:13px">Payment ID</span><span style="color:#e2e8f0;font-size:11px;font-family:monospace">${paymentId}</span></div>
    <div class="row"><span style="color:#64748b;font-size:13px">Amount Paid</span><span style="color:#f59e0b;font-size:13px;font-weight:700">$${amount} USDT (BSC)</span></div>
    <div class="row"><span style="color:#64748b;font-size:13px">Credits Added</span><span style="color:#10b981;font-size:13px;font-weight:700">+${Number(credits).toLocaleString()}</span></div>
    <div class="row"><span style="color:#64748b;font-size:13px">New Balance</span><span style="color:#818cf8;font-size:14px;font-weight:800">${Number(newBalance).toLocaleString()} credits</span></div>
  </div>
  <a href="https://vdnotify.vdscan.io/credits" class="btn">→ View Credits</a>
  <div style="background:#f59e0b10;border:1px solid #f59e0b30;border-radius:10px;padding:14px 16px">
    <div style="font-size:12px;color:#f59e0b;font-weight:700;margin-bottom:6px">💡 Remember</div>
    <div style="font-size:12px;color:#64748b;line-height:1.8">1 credit = 1 notification delivered<br>Credits never expire · Use anytime</div>
  </div>
</div>
<div class="footer">
  <p style="margin:0 0 4px">VDNotify · <a href="https://vdnotify.vdscan.io" style="color:#818cf8">vdnotify.vdscan.io</a></p>
  <p style="margin:0">Automated payment receipt. Keep for your records.</p>
</div>
</div></body></html>`
        });
        console.log(`✅ Payment email sent to ${email}`);
    } catch(e) {
        console.error('Payment email error:', e.message);
    }
};

module.exports = { testConnection, sendWelcomeEmail, sendPaymentConfirmationEmail };
