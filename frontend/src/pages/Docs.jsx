import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, Copy, Check, ChevronRight, ExternalLink } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import config from '../config';

const BASE_URL = 'https://vdnotify.vdscan.io';
const API_URL  = 'https://vdnotify.vdscan.io';

// Copy helper — works on HTTP too
const copyText = async (text, setCopied, key) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position='fixed'; ta.style.left='-9999px';
            document.body.appendChild(ta); ta.focus(); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
        }
        setCopied(key); setTimeout(() => setCopied(''), 2000);
    } catch(e) {}
};

const CodeBlock = ({ code, lang='bash', id }) => {
    const [copied, setCopied] = useState('');
    return (
        <div style={{background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:'10px', overflow:'hidden', marginBottom:'16px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom:'1px solid #1e1e2e', background:'#0d0d14'}}>
                <span style={{fontSize:'11px', color:'#64748b', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>{lang}</span>
                <button onClick={() => copyText(code, setCopied, id||code)} style={{
                    display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none',
                    cursor:'pointer', color: copied === (id||code) ? '#10b981' : '#64748b',
                    fontSize:'11px', fontWeight:'600', padding:'2px 6px', borderRadius:'4px',
                    transition:'color 0.15s',
                }}>
                    {copied === (id||code) ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy</>}
                </button>
            </div>
            <pre style={{padding:'16px', margin:0, fontSize:'12px', lineHeight:1.8, color:'#a5b4fc', overflow:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all'}}>
                {code}
            </pre>
        </div>
    );
};

const TabCode = ({ tabs }) => {
    const [active, setActive] = useState(tabs[0].label);
    const current = tabs.find(t => t.label === active);
    return (
        <div style={{border:'1px solid #1e1e2e', borderRadius:'10px', overflow:'hidden', marginBottom:'16px'}}>
            <div style={{display:'flex', background:'#0d0d14', borderBottom:'1px solid #1e1e2e', overflowX:'auto'}}>
                {tabs.map(t => (
                    <button key={t.label} onClick={() => setActive(t.label)} style={{
                        padding:'8px 16px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:'600',
                        background: active === t.label ? '#0a0a0f' : 'transparent',
                        color: active === t.label ? '#a5b4fc' : '#64748b',
                        borderBottom: active === t.label ? '2px solid #6366f1' : '2px solid transparent',
                        whiteSpace:'nowrap', transition:'all 0.15s',
                    }}>{t.label}</button>
                ))}
            </div>
            <div style={{background:'#0a0a0f'}}>
                <CodeBlock code={current.code} lang={current.lang || current.label.toLowerCase()} id={current.label}/>
            </div>
        </div>
    );
};

const Section = ({ id, title, children }) => (
    <div id={id} style={{marginBottom:'48px', scrollMarginTop:'80px'}}>
        <h2 style={{fontSize:'22px', fontWeight:'800', color:'var(--text)', marginBottom:'6px', letterSpacing:'-0.5px'}}>{title}</h2>
        <div style={{height:'3px', width:'40px', background:'linear-gradient(90deg,#6366f1,#818cf8)', borderRadius:'2px', marginBottom:'20px'}}/>
        {children}
    </div>
);

const SubSection = ({ id, title, children }) => (
    <div id={id} style={{marginBottom:'32px', scrollMarginTop:'80px'}}>
        <h3 style={{fontSize:'16px', fontWeight:'700', color:'var(--text)', marginBottom:'12px'}}>{title}</h3>
        {children}
    </div>
);

const Badge = ({ text, color='#6366f1' }) => (
    <span style={{background:color+'18', color, padding:'2px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', marginLeft:'8px'}}>{text}</span>
);

const MethodBadge = ({ method }) => {
    const colors = { GET:'#10b981', POST:'#6366f1', PATCH:'#f59e0b', PUT:'#3b82f6', DELETE:'#ef4444' };
    return <span style={{background:colors[method]+'20', color:colors[method], padding:'3px 10px', borderRadius:'5px', fontSize:'11px', fontWeight:'800', marginRight:'8px', letterSpacing:'0.5px'}}>{method}</span>;
};

const ParamRow = ({ name, type, required, desc }) => (
    <div style={{display:'flex', gap:'12px', padding:'10px 0', borderBottom:'1px solid var(--border)', flexWrap:'wrap'}}>
        <div style={{minWidth:'140px'}}>
            <code style={{fontSize:'12px', color:'var(--primary)', background:'var(--bg-card2)', padding:'2px 8px', borderRadius:'4px'}}>{name}</code>
            {required && <span style={{color:'#ef4444', fontSize:'10px', marginLeft:'4px', fontWeight:'700'}}>*</span>}
        </div>
        <code style={{fontSize:'11px', color:'#f59e0b', minWidth:'60px'}}>{type}</code>
        <div style={{flex:1, fontSize:'13px', color:'var(--text-muted)', minWidth:'200px'}}>{desc}</div>
    </div>
);

const navItems = [
    { id:'intro',       label:'Introduction' },
    { id:'auth',        label:'Authentication' },
    { id:'quickstart',  label:'Quick Start' },
    { id:'webhook-types', label:'Webhook Types' },
    { id:'create-webhook', label:'Create Webhook' },
    { id:'addresses',   label:'Manage Addresses' },
    { id:'payload',     label:'Payload Format' },
    { id:'security',    label:'Security & Signing' },
    { id:'logs',        label:'Notification Logs' },
    { id:'credits',     label:'Credits' },
    { id:'rate-limits', label:'Rate Limits' },
    { id:'errors',      label:'Error Handling' },
];

export default function Docs() {
    const { theme, toggleTheme } = useTheme();
    const [mobileNav, setMobileNav] = useState(false);
    const [activeSection, setActiveSection] = useState('intro');

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
            { rootMargin:'-20% 0px -70% 0px' }
        );
        navItems.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
        setMobileNav(false);
    };

    const Sidebar = () => (
        <div style={{padding:'20px 0'}}>
            <div style={{padding:'0 20px 16px', borderBottom:'1px solid var(--border)', marginBottom:'12px'}}>
                <Link to="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
                    <img src="/logo.svg" alt="logo" style={{width:'26px', height:'26px'}}/>
                    <span style={{fontWeight:'800', fontSize:'15px', color:'var(--text)'}}>{config.APP_NAME}</span>
                </Link>
                <div style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'4px', marginLeft:'34px'}}>API Documentation</div>
            </div>
            {navItems.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)} style={{
                    display:'block', width:'100%', textAlign:'left',
                    padding:'7px 20px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:'500',
                    background: activeSection === item.id ? '#6366f115' : 'transparent',
                    color: activeSection === item.id ? 'var(--primary)' : 'var(--text-muted)',
                    borderLeft: activeSection === item.id ? '2px solid var(--primary)' : '2px solid transparent',
                    transition:'all 0.15s',
                }}>{item.label}</button>
            ))}
            <div style={{padding:'16px 20px', marginTop:'12px', borderTop:'1px solid var(--border)'}}>
                <Link to="/signup" style={{display:'flex', alignItems:'center', gap:'6px', textDecoration:'none', background:'var(--primary)', color:'white', padding:'9px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', justifyContent:'center'}}>
                    Get API Key <ExternalLink size={12}/>
                </Link>
            </div>
        </div>
    );

    return (
        <div style={{minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column'}}>

            {/* Top Nav */}
            <header style={{position:'sticky', top:0, zIndex:200, background:'var(--bg-card)', borderBottom:'1px solid var(--border)', height:'54px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                    <button onClick={() => setMobileNav(!mobileNav)} className="docs-mobile-btn" style={{display:'none', background:'none', border:'none', color:'var(--text)', cursor:'pointer', padding:'4px'}}>
                        {mobileNav ? <X size={20}/> : <Menu size={20}/>}
                    </button>
                    <Link to="/" style={{display:'flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
                        <img src="/logo.svg" alt="logo" style={{width:'24px', height:'24px'}}/>
                        <span style={{fontWeight:'800', fontSize:'15px', color:'var(--text)'}} className="docs-title">{config.APP_NAME}</span>
                        <span style={{fontSize:'12px', color:'var(--text-muted)', background:'var(--bg-card2)', padding:'2px 8px', borderRadius:'4px', border:'1px solid var(--border)'}}>Docs</span>
                    </Link>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <button onClick={toggleTheme} style={{background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'8px', padding:'6px', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center'}}>
                        {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
                    </button>
                    <Link to="/dashboard" style={{fontSize:'13px', color:'var(--text-muted)', textDecoration:'none', padding:'6px 12px', border:'1px solid var(--border)', borderRadius:'7px', background:'var(--bg-card2)'}} className="docs-dashboard-btn">Dashboard →</Link>
                </div>
            </header>

            <div style={{display:'flex', flex:1}}>

                {/* Sidebar Desktop */}
                <aside className="docs-sidebar" style={{width:'220px', minWidth:'220px', borderRight:'1px solid var(--border)', position:'sticky', top:'54px', height:'calc(100vh - 54px)', overflowY:'auto', background:'var(--bg-card)'}}>
                    <Sidebar/>
                </aside>

                {/* Mobile Sidebar */}
                {mobileNav && (
                    <div style={{position:'fixed', top:'54px', left:0, right:0, bottom:0, background:'var(--bg-card)', zIndex:150, overflowY:'auto'}}>
                        <Sidebar/>
                    </div>
                )}

                {/* Content */}
                <main style={{flex:1, padding:'40px', maxWidth:'860px', overflowX:'hidden'}} className="docs-content">

                    {/* INTRO */}
                    <Section id="intro" title="Introduction">
                        <p style={{fontSize:'15px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'16px'}}>
                            VDNotify is a real-time webhook notification service for VDChain (Chain ID: 882022). Monitor any wallet address for transactions and receive instant HTTP POST callbacks or email notifications — compatible with Alchemy's payload format.
                        </p>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px', marginBottom:'20px'}}>
                            {[
                                { label:'Base URL', value: API_URL, color:'#6366f1' },
                                { label:'Network', value:'VDCHAIN_MAINNET', color:'#10b981' },
                                { label:'Chain ID', value:'882022', color:'#f59e0b' },
                                { label:'Currency', value:'VDC', color:'#818cf8' },
                            ].map((s,i) => (
                                <div key={i} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px 14px'}}>
                                    <div style={{fontSize:'10px', color:'var(--text-muted)', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px'}}>{s.label}</div>
                                    <code style={{fontSize:'12px', color:s.color, fontWeight:'700'}}>{s.value}</code>
                                </div>
                            ))}
                        </div>
                        <div style={{background:'#6366f110', border:'1px solid #6366f130', borderRadius:'10px', padding:'12px 16px', fontSize:'13px', color:'#818cf8', lineHeight:1.7}}>
                            💡 VDNotify uses the same payload format as <strong>Alchemy's Address Activity Webhook</strong>. If you've used Alchemy before, integration takes minutes.
                        </div>
                    </Section>

                    {/* AUTH */}
                    <Section id="auth" title="Authentication">
                        <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'16px'}}>
                            VDNotify supports two authentication methods. Use either in your requests.
                        </p>

                        <SubSection id="auth-jwt" title="1. JWT Bearer Token">
                            <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'12px'}}>Obtain after login. Valid for 7 days.</p>
                            <CodeBlock lang="HTTP Header" code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`} id="auth-jwt"/>
                        </SubSection>

                        <SubSection id="auth-apikey" title="2. API Key">
                            <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'12px'}}>Found in your dashboard. Never expires.</p>
                            <CodeBlock lang="HTTP Header" code={`X-API-Key: 70eaa1dfc2ca5f4a51d1ff20d38d7f385b26b1e59aba7bcfb25d4a68003859c2`} id="auth-apikey"/>
                            <CodeBlock lang="cURL" code={`curl -X GET ${API_URL}/api/webhooks \\
  -H "X-API-Key: YOUR_API_KEY"`} id="auth-curl"/>
                        </SubSection>

                        <SubSection id="auth-login" title="Get JWT Token">
                            <CodeBlock lang="cURL" code={`curl -X POST ${API_URL}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@example.com",
    "password": "yourpassword"
  }'`} id="login-curl"/>
                            <CodeBlock lang="Response" code={`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "you@example.com",
    "api_key": "70eaa1dfc2ca5f4a...",
    "credit_balance": 500
  }
}`} id="login-resp"/>
                        </SubSection>
                    </Section>

                    {/* QUICKSTART */}
                    <Section id="quickstart" title="Quick Start">
                        <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'20px'}}>Get up and running in 3 steps:</p>

                        {[
                            { n:'01', title:'Sign up & get your API key', desc:'Create a free account to get 500 credits and your API key.' },
                            { n:'02', title:'Create a webhook', desc:'Register your endpoint URL or email addresses.' },
                            { n:'03', title:'Add wallet addresses', desc:'Add addresses to monitor. You\'ll receive notifications instantly.' },
                        ].map((s,i) => (
                            <div key={i} style={{display:'flex', gap:'14px', marginBottom:'16px', alignItems:'flex-start'}}>
                                <div style={{width:'36px', height:'36px', background:'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'white', flexShrink:0}}>{s.n}</div>
                                <div>
                                    <div style={{fontSize:'14px', fontWeight:'700', color:'var(--text)', marginBottom:'3px'}}>{s.title}</div>
                                    <div style={{fontSize:'13px', color:'var(--text-muted)'}}>{s.desc}</div>
                                </div>
                            </div>
                        ))}

                        <div style={{marginTop:'24px'}}>
                            <div style={{fontSize:'14px', fontWeight:'700', color:'var(--text)', marginBottom:'12px'}}>Full Quick Start Example:</div>
                            <TabCode tabs={[
                                { label:'cURL', lang:'bash', code:`# Step 1: Create webhook
curl -X POST ${API_URL}/api/webhooks \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My First Webhook",
    "url": "https://your-server.com/webhook",
    "type": "ADDRESS_ACTIVITY",
    "notification_type": "webhook"
  }'

# Step 2: Add address to monitor
curl -X PATCH ${API_URL}/api/webhooks/WEBHOOK_UUID/addresses \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "addresses_to_add": ["0xB614a19A1D7CF831C0DE236367891ac66bd9143B"]
  }'` },
                                { label:'Node.js', lang:'javascript', code:`const axios = require('axios');

const API_KEY = 'YOUR_API_KEY';
const BASE    = '${API_URL}';

// Create webhook
const wh = await axios.post(\`\${BASE}/api/webhooks\`, {
  name: 'My Webhook',
  url: 'https://your-server.com/webhook',
  type: 'ADDRESS_ACTIVITY',
  notification_type: 'webhook'
}, { headers: { 'X-API-Key': API_KEY } });

// Add address
await axios.patch(\`\${BASE}/api/webhooks/\${wh.data.webhook.id}/addresses\`, {
  addresses_to_add: ['0xB614a19A1D7CF831C0DE236367891ac66bd9143B']
}, { headers: { 'X-API-Key': API_KEY } });

console.log('Webhook ID:', wh.data.webhook.webhook_id);` },
                                { label:'Python', lang:'python', code:`import requests

API_KEY = 'YOUR_API_KEY'
BASE    = '${API_URL}'
HEADERS = {'X-API-Key': API_KEY, 'Content-Type': 'application/json'}

# Create webhook
wh = requests.post(f'{BASE}/api/webhooks', json={
    'name': 'My Webhook',
    'url': 'https://your-server.com/webhook',
    'type': 'ADDRESS_ACTIVITY',
    'notification_type': 'webhook'
}, headers=HEADERS).json()

wh_id = wh['webhook']['id']

# Add address
requests.patch(f'{BASE}/api/webhooks/{wh_id}/addresses', json={
    'addresses_to_add': ['0xB614a19A1D7CF831C0DE236367891ac66bd9143B']
}, headers=HEADERS)

print('Webhook ID:', wh['webhook']['webhook_id'])` },
                                { label:'PHP', lang:'php', code:`<?php
$apiKey = 'YOUR_API_KEY';
$base   = '${API_URL}';

// Create webhook
$ch = curl_init("$base/api/webhooks");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["X-API-Key: $apiKey", "Content-Type: application/json"],
    CURLOPT_POSTFIELDS => json_encode([
        'name' => 'My Webhook',
        'url'  => 'https://your-server.com/webhook',
        'type' => 'ADDRESS_ACTIVITY',
        'notification_type' => 'webhook'
    ])
]);
$wh = json_decode(curl_exec($ch), true);
$whId = $wh['webhook']['id'];

// Add address
$ch2 = curl_init("$base/api/webhooks/$whId/addresses");
curl_setopt_array($ch2, [
    CURLOPT_CUSTOMREQUEST => 'PATCH',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["X-API-Key: $apiKey", "Content-Type: application/json"],
    CURLOPT_POSTFIELDS => json_encode([
        'addresses_to_add' => ['0xB614a19A1D7CF831C0DE236367891ac66bd9143B']
    ])
]);
curl_exec($ch2);` },
                            ]}/>
                        </div>
                    </Section>

                    {/* WEBHOOK TYPES */}
                    <Section id="webhook-types" title="Webhook Types">
                        {[
                            { type:'ADDRESS_ACTIVITY', badge:'Most Popular', color:'#6366f1', desc:'Get notified when a tracked wallet address sends or receives VDC or any ERC-20 token.', usecase:'DexPrime wallet, portfolio tracker, exchange deposit detection' },
                            { type:'CONTRACT_ACTIVITY', badge:'Advanced', color:'#f59e0b', desc:'Monitor all transactions to/from a specific smart contract address.', usecase:'DEX swap monitoring, NFT contract events, DeFi protocol tracking' },
                            { type:'TOKEN_ACTIVITY', badge:'Coming Soon', color:'#64748b', desc:'Track ERC-20 token transfers for a specific token contract.', usecase:'Token distribution, airdrop tracking, token analytics' },
                        ].map((w,i) => (
                            <div key={i} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px', marginBottom:'12px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', flexWrap:'wrap'}}>
                                    <code style={{fontSize:'13px', color:w.color, fontWeight:'800', background:w.color+'15', padding:'3px 10px', borderRadius:'5px'}}>{w.type}</code>
                                    <Badge text={w.badge} color={w.color}/>
                                </div>
                                <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'6px', lineHeight:1.7}}>{w.desc}</p>
                                <p style={{fontSize:'12px', color:'var(--text-muted)'}}><strong style={{color:'var(--text)'}}>Use case:</strong> {w.usecase}</p>
                            </div>
                        ))}
                    </Section>

                    {/* CREATE WEBHOOK */}
                    <Section id="create-webhook" title="Create Webhook">
                        <div style={{display:'flex', alignItems:'center', marginBottom:'12px'}}>
                            <MethodBadge method="POST"/>
                            <code style={{fontSize:'13px', color:'var(--text)'}}>/api/webhooks</code>
                        </div>

                        <div style={{marginBottom:'16px'}}>
                            <div style={{fontSize:'13px', fontWeight:'700', color:'var(--text)', marginBottom:'8px'}}>Request Body Parameters</div>
                            <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'0 16px'}}>
                                <ParamRow name="name" type="string" required={false} desc="Display name for the webhook (default: 'My Webhook')"/>
                                <ParamRow name="url" type="string" required={true} desc="Your endpoint URL for HTTP webhooks. Required if notification_type is 'webhook'"/>
                                <ParamRow name="type" type="enum" required={false} desc="ADDRESS_ACTIVITY | CONTRACT_ACTIVITY | TOKEN_ACTIVITY (default: ADDRESS_ACTIVITY)"/>
                                <ParamRow name="notification_type" type="enum" required={false} desc="'webhook' for HTTP POST or 'email' for email alerts (default: webhook)"/>
                                <ParamRow name="email_addresses" type="array" required={false} desc="Array of email addresses. Required if notification_type is 'email'"/>
                            </div>
                        </div>

                        <SubSection id="create-http" title="HTTP Webhook Example">
                            <TabCode tabs={[
                                { label:'cURL', code:`curl -X POST ${API_URL}/api/webhooks \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Wallet Monitor",
    "url": "https://your-server.com/webhook",
    "type": "ADDRESS_ACTIVITY",
    "notification_type": "webhook"
  }'` },
                                { label:'Node.js', code:`const res = await axios.post('${API_URL}/api/webhooks', {
  name: 'Wallet Monitor',
  url: 'https://your-server.com/webhook',
  type: 'ADDRESS_ACTIVITY',
  notification_type: 'webhook'
}, {
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});
console.log(res.data.webhook.webhook_id); // wh_xxx` },
                                { label:'Python', code:`res = requests.post('${API_URL}/api/webhooks',
  json={
    'name': 'Wallet Monitor',
    'url': 'https://your-server.com/webhook',
    'type': 'ADDRESS_ACTIVITY',
    'notification_type': 'webhook'
  },
  headers={'X-API-Key': 'YOUR_API_KEY'}
)
print(res.json()['webhook']['webhook_id'])` },
                            ]}/>
                        </SubSection>

                        <SubSection id="create-email" title="Email Notification Example">
                            <TabCode tabs={[
                                { label:'cURL', code:`curl -X POST ${API_URL}/api/webhooks \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Email Alerts",
    "type": "ADDRESS_ACTIVITY",
    "notification_type": "email",
    "email_addresses": ["user@gmail.com", "admin@example.com"]
  }'` },
                                { label:'Node.js', code:`await axios.post('${API_URL}/api/webhooks', {
  name: 'Email Alerts',
  type: 'ADDRESS_ACTIVITY',
  notification_type: 'email',
  email_addresses: ['user@gmail.com', 'admin@example.com']
}, {
  headers: { 'X-API-Key': 'YOUR_API_KEY' }
});` },
                            ]}/>
                            <div style={{background:'#10b98110', border:'1px solid #10b98130', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', color:'#10b981'}}>
                                💡 Each email address counts as 1 credit per notification. 2 emails = 2 credits per transaction.
                            </div>
                        </SubSection>

                        <SubSection id="create-response" title="Response">
                            <CodeBlock lang="JSON" code={`{
  "success": true,
  "webhook": {
    "id": "786e91b4-aa73-43ad-ba8e-9db40a3502a0",
    "webhook_id": "wh_cbfee696fb0f1aa5029a",
    "name": "Wallet Monitor",
    "type": "ADDRESS_ACTIVITY",
    "url": "https://your-server.com/webhook",
    "signing_key": "whsec_1be139c9697ebec8613d4a2b499d96d7341662be",
    "status": "active",
    "notification_type": "webhook",
    "total_fired": 0,
    "created_at": "2026-05-24T00:00:00.000Z"
  }
}`}/>
                        </SubSection>
                    </Section>

                    {/* ADDRESSES */}
                    <Section id="addresses" title="Manage Addresses">
                        <SubSection id="add-addresses" title="Add / Remove Addresses">
                            <div style={{display:'flex', alignItems:'center', marginBottom:'12px'}}>
                                <MethodBadge method="PATCH"/>
                                <code style={{fontSize:'13px', color:'var(--text)'}}>/api/webhooks/:id/addresses</code>
                            </div>
                            <TabCode tabs={[
                                { label:'cURL', code:`# Add addresses
curl -X PATCH ${API_URL}/api/webhooks/WEBHOOK_UUID/addresses \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "addresses_to_add": [
      "0xB614a19A1D7CF831C0DE236367891ac66bd9143B",
      "0xD4949664cD82660AaE99bEdc034a0deA8A0bd517",
      "0x0E9Ec734063d2FbeE3b88C20b04223669686E30b"
    ],
    "addresses_to_remove": []
  }'` },
                                { label:'Node.js', code:`// Add multiple addresses at once
await axios.patch(
  \`${API_URL}/api/webhooks/\${webhookId}/addresses\`,
  {
    addresses_to_add: [
      '0xB614a19A1D7CF831C0DE236367891ac66bd9143B',
      '0xD4949664cD82660AaE99bEdc034a0deA8A0bd517'
    ],
    addresses_to_remove: [] // optional
  },
  { headers: { 'X-API-Key': API_KEY } }
);` },
                                { label:'Python', code:`requests.patch(
  f'${API_URL}/api/webhooks/{webhook_id}/addresses',
  json={
    'addresses_to_add': [
      '0xB614a19A1D7CF831C0DE236367891ac66bd9143B',
      '0xD4949664cD82660AaE99bEdc034a0deA8A0bd517'
    ],
    'addresses_to_remove': []
  },
  headers={'X-API-Key': API_KEY}
)` },
                            ]}/>
                            <CodeBlock lang="Response" code={`{
  "success": true,
  "total_addresses": 3
}`}/>
                        </SubSection>

                        <SubSection id="list-addresses" title="List Addresses">
                            <div style={{display:'flex', alignItems:'center', marginBottom:'12px'}}>
                                <MethodBadge method="GET"/>
                                <code style={{fontSize:'13px', color:'var(--text)'}}>/api/webhooks/:id/addresses</code>
                            </div>
                            <CodeBlock lang="cURL" code={`curl -X GET ${API_URL}/api/webhooks/WEBHOOK_UUID/addresses \\
  -H "X-API-Key: YOUR_API_KEY"`}/>
                            <CodeBlock lang="Response" code={`{
  "success": true,
  "addresses": [
    {
      "address": "0xb614a19a1d7cf831c0de236367891ac66bd9143b",
      "label": null,
      "added_at": "2026-05-24T00:00:00.000Z"
    }
  ]
}`}/>
                        </SubSection>
                    </Section>

                    {/* PAYLOAD */}
                    <Section id="payload" title="Payload Format">
                        <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'16px'}}>
                            VDNotify sends an HTTP POST to your webhook URL with the following JSON body. The format is compatible with <strong style={{color:'var(--text)'}}>Alchemy's ADDRESS_ACTIVITY webhook</strong>.
                        </p>

                        <SubSection id="payload-native" title="Native VDC Transfer">
                            <CodeBlock lang="JSON Payload" code={`{
  "webhookId": "wh_cbfee696fb0f1aa5029a",
  "id": "whevt_fafdeebe2bf4bc74f91e",
  "createdAt": "2026-05-24T00:51:18.161Z",
  "type": "ADDRESS_ACTIVITY",
  "event": {
    "network": "VDCHAIN_MAINNET",
    "activity": [
      {
        "blockNum": "0x1214d5",
        "hash": "0xa193d29072e436f9e91ded970504e45e0d27c927d8901bb8a9c601e4ec762f1c",
        "fromAddress": "0xb614a19a1d7cf831c0de236367891ac66bd9143b",
        "toAddress": "0x0e9ec734063d2fbee3b88c20b04223669686e30b",
        "value": 10.5,
        "asset": "VDC",
        "category": "external",
        "erc721TokenId": null,
        "erc1155Metadata": null,
        "typeTraceAddress": null,
        "rawContract": {
          "rawValue": "0x8ac7230489e80000",
          "address": null,
          "decimals": 18
        },
        "log": null
      }
    ]
  }
}`}/>
                        </SubSection>

                        <SubSection id="payload-token" title="ERC-20 Token Transfer">
                            <CodeBlock lang="JSON Payload" code={`{
  "webhookId": "wh_xxx",
  "id": "whevt_xxx",
  "createdAt": "2026-05-24T00:00:00Z",
  "type": "ADDRESS_ACTIVITY",
  "event": {
    "network": "VDCHAIN_MAINNET",
    "activity": [
      {
        "blockNum": "0x1214d5",
        "hash": "0xabc123...",
        "fromAddress": "0xb614a1...143b",
        "toAddress": "0x0e9ec7...e30b",
        "value": 100.0,
        "asset": "UNKNOWN",
        "category": "token",
        "rawContract": {
          "rawValue": "0x56bc75e2d63100000",
          "address": "0x227a115597e3fee9fe7b8dcfb669c803c2e87b6a",
          "decimals": 18
        },
        "log": {
          "address": "0x227a115597e3fee9fe7b8dcfb669c803c2e87b6a",
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000b614a19a...",
            "0x0000000000000000000000000e9ec734..."
          ],
          "data": "0x0000000000000000000000000000000000000000000000056bc75e2d63100000",
          "blockNumber": "0x1214d5",
          "transactionHash": "0xabc123...",
          "blockHash": "0xdef456...",
          "logIndex": "0x1",
          "removed": false
        }
      }
    ]
  }
}`}/>
                        </SubSection>

                        <SubSection id="payload-fields" title="Field Reference">
                            <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'0 16px'}}>
                                <ParamRow name="webhookId" type="string" desc="Your webhook's unique ID (wh_xxx)"/>
                                <ParamRow name="id" type="string" desc="Unique event ID for this notification (whevt_xxx)"/>
                                <ParamRow name="createdAt" type="ISO8601" desc="Timestamp when the notification was sent"/>
                                <ParamRow name="type" type="enum" desc="Always ADDRESS_ACTIVITY"/>
                                <ParamRow name="event.network" type="string" desc="Always VDCHAIN_MAINNET"/>
                                <ParamRow name="activity[].blockNum" type="hex" desc="Block number in hex (e.g. 0x1214d5)"/>
                                <ParamRow name="activity[].hash" type="string" desc="Transaction hash"/>
                                <ParamRow name="activity[].fromAddress" type="string" desc="Sender address (lowercase)"/>
                                <ParamRow name="activity[].toAddress" type="string" desc="Receiver address (lowercase)"/>
                                <ParamRow name="activity[].value" type="number" desc="Amount transferred (human readable, divided by decimals)"/>
                                <ParamRow name="activity[].asset" type="string" desc="'VDC' for native, token symbol or 'UNKNOWN' for ERC-20"/>
                                <ParamRow name="activity[].category" type="enum" desc="'external' = VDC transfer, 'token' = ERC-20 transfer"/>
                                <ParamRow name="activity[].log" type="object|null" desc="Full EVM log object for token transfers. null for native transfers"/>
                            </div>
                        </SubSection>
                    </Section>

                    {/* SECURITY */}
                    <Section id="security" title="Security & Signing">
                        <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'16px'}}>
                            Every webhook POST request includes a signature header. Verify this to ensure requests are genuinely from VDNotify.
                        </p>

                        <SubSection id="security-header" title="Signature Header">
                            <CodeBlock lang="HTTP Header" code={`X-VDNotify-Signature: a3f8c2d1e5b7a9f0c4d2e6b8a1f3c5d7e9b2a4f6c8d0e2b4a6f8c0d2e4b6a8f`}/>
                            <div style={{background:'#f59e0b10', border:'1px solid #f59e0b30', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', color:'#f59e0b', marginBottom:'16px'}}>
                                ⚠️ Always verify the signature before processing webhook events in production.
                            </div>
                        </SubSection>

                        <SubSection id="security-verify" title="Verify Signature">
                            <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'12px'}}>
                                The signature is an HMAC-SHA256 hash of the raw request body using your webhook's signing key.
                            </p>
                            <TabCode tabs={[
                                { label:'Node.js', code:`const crypto = require('crypto');

function verifyWebhook(rawBody, signature, signingKey) {
  const expected = crypto
    .createHmac('sha256', signingKey)
    .update(rawBody, 'utf8')
    .digest('hex');
  return expected === signature;
}

// Express example
app.post('/webhook', express.raw({type:'application/json'}), (req, res) => {
  const sig = req.headers['x-vdnotify-signature'];
  const key = 'whsec_your_signing_key_here';

  if (!verifyWebhook(req.body, sig, key)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  console.log('Verified event:', event.type);
  res.status(200).send('OK');
});` },
                                { label:'Python', code:`import hmac, hashlib

def verify_webhook(raw_body: bytes, signature: str, signing_key: str) -> bool:
    expected = hmac.new(
        signing_key.encode('utf-8'),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

# Flask example
from flask import Flask, request
app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    sig = request.headers.get('X-VDNotify-Signature')
    key = 'whsec_your_signing_key_here'

    if not verify_webhook(request.get_data(), sig, key):
        return 'Invalid signature', 401

    event = request.get_json()
    print(f"Verified: {event['type']}")
    return 'OK', 200` },
                                { label:'PHP', code:`<?php
function verifyWebhook($rawBody, $signature, $signingKey) {
    $expected = hash_hmac('sha256', $rawBody, $signingKey);
    return hash_equals($expected, $signature);
}

$rawBody   = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_VDNOTIFY_SIGNATURE'] ?? '';
$key       = 'whsec_your_signing_key_here';

if (!verifyWebhook($rawBody, $signature, $key)) {
    http_response_code(401);
    die('Invalid signature');
}

$event = json_decode($rawBody, true);
echo 'OK';` },
                            ]}/>
                        </SubSection>

                        <SubSection id="security-respond" title="Responding to Webhooks">
                            <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'16px'}}>
                                <div style={{fontSize:'13px', color:'var(--text)', marginBottom:'10px', fontWeight:'600'}}>Requirements:</div>
                                {[
                                    'Respond with HTTP 200 to acknowledge receipt',
                                    'Respond within 10 seconds to avoid timeout',
                                    'Non-200 responses trigger automatic retries',
                                    'Process the event asynchronously if needed',
                                ].map((r,i) => (
                                    <div key={i} style={{display:'flex', gap:'8px', alignItems:'flex-start', marginBottom:'6px'}}>
                                        <span style={{color:'#10b981', fontWeight:'700', flexShrink:0}}>✓</span>
                                        <span style={{fontSize:'13px', color:'var(--text-muted)'}}>{r}</span>
                                    </div>
                                ))}
                            </div>
                        </SubSection>
                    </Section>

                    {/* LOGS */}
                    <Section id="logs" title="Notification Logs">
                        <div style={{display:'flex', alignItems:'center', marginBottom:'12px'}}>
                            <MethodBadge method="GET"/>
                            <code style={{fontSize:'13px', color:'var(--text)'}}>/api/webhooks/:id/logs?limit=50</code>
                        </div>
                        <CodeBlock lang="cURL" code={`curl -X GET "${API_URL}/api/webhooks/WEBHOOK_UUID/logs?limit=20" \\
  -H "X-API-Key: YOUR_API_KEY"`}/>
                        <CodeBlock lang="Response" code={`{
  "success": true,
  "logs": [
    {
      "event_id": "whevt_fafdeebe2bf4bc74f91e",
      "tx_hash": "0xa193d29072e436f9e91d...",
      "block_number": 1185109,
      "event_type": "ADDRESS_ACTIVITY",
      "status": "delivered",
      "http_status": 200,
      "attempt_count": 1,
      "delivered_at": "2026-05-24T00:51:18.500Z",
      "created_at": "2026-05-24T00:51:18.161Z"
    }
  ]
}`}/>
                        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'0 16px'}}>
                            <ParamRow name="status" type="enum" desc="pending | delivered | failed | retrying"/>
                            <ParamRow name="http_status" type="integer" desc="HTTP response code from your server (200, 404, 500 etc)"/>
                            <ParamRow name="attempt_count" type="integer" desc="Number of delivery attempts made"/>
                        </div>
                    </Section>

                    {/* CREDITS */}
                    <Section id="credits" title="Credits">
                        <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'16px'}}>
                            Each notification delivery deducts 1 credit. For email notifications, each recipient counts as 1 credit.
                        </p>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'12px', marginBottom:'20px'}}>
                            {[
                                { label:'HTTP webhook fired', credits:'1 credit' },
                                { label:'Email (per recipient)', credits:'1 credit' },
                                { label:'Failed delivery', credits:'1 credit' },
                                { label:'No credits left', credits:'Skipped' },
                            ].map((s,i) => (
                                <div key={i} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'9px', padding:'12px'}}>
                                    <div style={{fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px'}}>{s.label}</div>
                                    <div style={{fontSize:'14px', fontWeight:'800', color:'var(--primary)'}}>{s.credits}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{display:'flex', alignItems:'center', marginBottom:'12px'}}>
                            <MethodBadge method="GET"/>
                            <code style={{fontSize:'13px', color:'var(--text)'}}>/api/credits</code>
                        </div>
                        <CodeBlock lang="cURL" code={`curl -X GET ${API_URL}/api/credits \\
  -H "X-API-Key: YOUR_API_KEY"`}/>
                        <CodeBlock lang="Response" code={`{
  "success": true,
  "credit_balance": 499,
  "credits_reset_at": "2026-06-24T00:00:00.000Z",
  "history": [
    {
      "type": "usage_deduct",
      "amount": -1,
      "balance": 499,
      "description": "Notification fired: whevt_xxx",
      "created_at": "2026-05-24T00:51:18Z"
    }
  ]
}`}/>
                    </Section>

                    {/* RATE LIMITS */}
                    <Section id="rate-limits" title="Rate Limits">
                        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px'}}>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0'}}>
                                {[['Endpoint','Limit','Window'],['POST /api/webhooks','10 req','per minute'],['PATCH addresses','20 req','per minute'],['GET endpoints','60 req','per minute'],['Auth endpoints','5 req','per minute']].map((row,i) => (
                                    <div key={i} style={{display:'contents'}}>
                                        {row.map((cell,j) => (
                                            <div key={j} style={{
                                                padding:'10px 14px', fontSize: i===0?'11px':'12px',
                                                fontWeight: i===0?'700':'400',
                                                color: i===0?'var(--text-muted)':'var(--text)',
                                                background: i===0?'var(--bg-card2)':'transparent',
                                                borderBottom: i<4?'1px solid var(--border)':'none',
                                                textTransform: i===0?'uppercase':'none',
                                                letterSpacing: i===0?'0.5px':'0',
                                            }}>{cell}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{background:'#6366f110', border:'1px solid #6366f130', borderRadius:'8px', padding:'10px 14px', fontSize:'12px', color:'#818cf8'}}>
                            💡 Rate limit headers: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>
                        </div>
                    </Section>

                    {/* ERRORS */}
                    <Section id="errors" title="Error Handling">
                        <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'16px'}}>
                            All errors return a JSON body with an <code style={{color:'var(--primary)'}}>error</code> field.
                        </p>
                        <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'16px'}}>
                            {[
                                ['400','Bad Request','Missing required fields or invalid parameters'],
                                ['401','Unauthorized','Invalid or missing API key / JWT token'],
                                ['404','Not Found','Webhook or resource not found'],
                                ['429','Too Many Requests','Rate limit exceeded'],
                                ['500','Server Error','Internal server error — retry after a moment'],
                            ].map(([code, title, desc], i) => (
                                <div key={i} style={{display:'flex', gap:'16px', padding:'12px 16px', borderBottom: i<4?'1px solid var(--border)':'none', alignItems:'flex-start', flexWrap:'wrap'}}>
                                    <code style={{
                                        minWidth:'36px', fontSize:'13px', fontWeight:'800',
                                        color: code==='400'||code==='401'||code==='404'?'#ef4444' : code==='429'?'#f59e0b' : '#ef4444',
                                    }}>{code}</code>
                                    <div style={{minWidth:'120px', fontSize:'13px', fontWeight:'600', color:'var(--text)'}}>{title}</div>
                                    <div style={{flex:1, fontSize:'13px', color:'var(--text-muted)'}}>{desc}</div>
                                </div>
                            ))}
                        </div>

                        <SubSection id="error-example" title="Error Response Example">
                            <CodeBlock lang="JSON" code={`{
  "error": "Webhook URL required"
}

// 401 example
{
  "error": "Invalid token"
}

// 429 example
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}`}/>
                        </SubSection>

                        <SubSection id="retry-logic" title="Retry Logic">
                            <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'12px', lineHeight:1.7}}>
                                When your server returns a non-200 response, VDNotify automatically retries:
                            </p>
                            <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'10px', padding:'16px'}}>
                                {[
                                    ['Attempt 1','Immediately'],
                                    ['Attempt 2','30 seconds later'],
                                    ['Attempt 3','2 minutes later'],
                                    ['Attempt 4','5 minutes later'],
                                    ['Attempt 5','10 minutes later'],
                                    ['After 5 fails','Webhook marked failed — check logs'],
                                ].map(([attempt, timing], i) => (
                                    <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom: i<5?'1px solid var(--border)':'none', fontSize:'13px'}}>
                                        <span style={{color: i===5?'#ef4444':'var(--text)', fontWeight: i===5?'600':'400'}}>{attempt}</span>
                                        <span style={{color:'var(--text-muted)'}}>{timing}</span>
                                    </div>
                                ))}
                            </div>
                        </SubSection>
                    </Section>

                    {/* Footer */}
                    <div style={{borderTop:'1px solid var(--border)', paddingTop:'32px', textAlign:'center'}}>
                        <p style={{fontSize:'13px', color:'var(--text-muted)', marginBottom:'12px'}}>
                            Need help? Check the{' '}
                            <Link to="/dashboard" style={{color:'var(--primary)', textDecoration:'none'}}>Dashboard</Link>
                            {' '}or contact support.
                        </p>
                        <p style={{fontSize:'12px', color:'var(--text-muted)'}}>
                            VDNotify • VDChain (882022) • Built by UD Pixel Digital Service
                        </p>
                    </div>

                </main>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .docs-sidebar { display: none !important; }
                    .docs-mobile-btn { display: flex !important; }
                    .docs-content { padding: 20px 14px !important; }
                    .docs-dashboard-btn { display: none !important; }
                }
            `}</style>
        </div>
    );
}