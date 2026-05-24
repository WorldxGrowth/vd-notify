import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Webhook, Trash2, ExternalLink, Copy, Check, Mail, Globe, X, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function Webhooks() {
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name:'', url:'', type:'ADDRESS_ACTIVITY', notification_type:'webhook', email_addresses:[] });
    const [emailInput, setEmailInput] = useState('');
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState('');
    const [urlTest, setUrlTest] = useState({ status:'idle', msg:'' }); // idle | testing | ok | fail

    useEffect(() => { loadWebhooks(); }, []);

    const loadWebhooks = async () => {
        try {
            const r = await api.get('/api/webhooks');
            setWebhooks(r.data.webhooks);
        } catch(e) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const testUrl = async () => {
        if (!form.url) return;
        setUrlTest({ status:'testing', msg:'' });
        try {
            const res = await fetch(form.url, {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    webhookId:'wh_test',
                    id:'whevt_test',
                    createdAt: new Date().toISOString(),
                    type:'ADDRESS_ACTIVITY',
                    event:{ network:'VDCHAIN_MAINNET', activity:[{ blockNum:'0x1', hash:'0xtest', fromAddress:'0x000', toAddress:'0x000', value:0, asset:'VDC', category:'external' }] }
                }),
            });
            if (res.ok) {
                setUrlTest({ status:'ok', msg:`${res.status} OK` });
            } else {
                setUrlTest({ status:'fail', msg:`${res.status} Error` });
            }
        } catch(e) {
            setUrlTest({ status:'fail', msg:'Unreachable' });
        }
    };

    const addEmail = () => {
        const email = emailInput.trim();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return toast.error('Invalid email');
        if (form.email_addresses.includes(email)) return toast.error('Already added');
        setForm({...form, email_addresses:[...form.email_addresses, email]});
        setEmailInput('');
    };

    const removeEmail = (email) => setForm({...form, email_addresses: form.email_addresses.filter(e => e !== email)});

    const createWebhook = async (e) => {
        e.preventDefault();
        if (form.notification_type === 'webhook' && !form.url) return toast.error('URL required');
        if (form.notification_type === 'email' && form.email_addresses.length === 0) return toast.error('Add at least one email');
        setCreating(true);
        try {
            await api.post('/api/webhooks', form);
            toast.success('Webhook created!');
            setShowCreate(false);
            setForm({ name:'', url:'', type:'ADDRESS_ACTIVITY', notification_type:'webhook', email_addresses:[] });
            setEmailInput('');
            setUrlTest({ status:'idle', msg:'' });
            loadWebhooks();
        } catch(err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally { setCreating(false); }
    };

    const closeModal = () => {
        setShowCreate(false);
        setForm({ name:'', url:'', type:'ADDRESS_ACTIVITY', notification_type:'webhook', email_addresses:[] });
        setEmailInput('');
        setUrlTest({ status:'idle', msg:'' });
    };

    const deleteWebhook = async (id) => {
        if (!confirm('Delete this webhook?')) return;
        try {
            await api.delete(`/api/webhooks/${id}`);
            toast.success('Deleted');
            setWebhooks(webhooks.filter(w => w.id !== id));
        } catch(e) { toast.error('Failed to delete'); }
    };

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(''), 2000);
    };

    const getEmailCount = (w) => {
        try {
            const arr = typeof w.email_addresses === 'string' ? JSON.parse(w.email_addresses) : w.email_addresses;
            return Array.isArray(arr) ? arr.length : 0;
        } catch { return 0; }
    };

    const testBtnColor = urlTest.status === 'ok' ? '#10b981' : urlTest.status === 'fail' ? '#ef4444' : urlTest.status === 'testing' ? '#f59e0b' : 'var(--text-muted)';

    return (
        <div style={{maxWidth:'900px'}}>
            {/* Header */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'12px'}}>
                <div>
                    <h1 style={{fontSize:'clamp(20px,3vw,26px)', fontWeight:'800', marginBottom:'4px', color:'var(--text)', letterSpacing:'-0.5px'}}>Webhooks</h1>
                    <p style={{color:'var(--text-muted)', fontSize:'14px'}}>{webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)} style={{display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px'}}>
                    <Plus size={16}/> Create Webhook
                </button>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}
                    onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'16px', width:'100%', maxWidth:'500px', maxHeight:'92vh', overflowY:'auto'}}>
                        {/* Modal Header */}
                        <div style={{padding:'20px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
                            <div>
                                <h2 style={{fontSize:'18px', fontWeight:'800', color:'var(--text)'}}>Create Webhook</h2>
                                <p style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'2px'}}>Configure your notification endpoint</p>
                            </div>
                            <button onClick={closeModal} style={{background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)'}}>
                                <X size={16}/>
                            </button>
                        </div>

                        <div style={{padding:'0 24px 24px'}}>
                            <form onSubmit={createWebhook}>
                                {/* Name */}
                                <div style={{marginBottom:'16px'}}>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:'600', marginBottom:'6px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Name</label>
                                    <input placeholder="My Webhook" value={form.name} onChange={e => setForm({...form, name:e.target.value})}/>
                                </div>

                                {/* Webhook Type */}
                                <div style={{marginBottom:'16px'}}>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:'600', marginBottom:'6px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Event Type</label>
                                    <select value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                                        <option value="ADDRESS_ACTIVITY">Address Activity — wallet send/receive</option>
                                        <option value="CONTRACT_ACTIVITY">Contract Activity — smart contract events</option>
                                        <option value="TOKEN_ACTIVITY">Token Activity — ERC-20 transfers</option>
                                    </select>
                                </div>

                                {/* Notification Type */}
                                <div style={{marginBottom:'16px'}}>
                                    <label style={{display:'block', fontSize:'12px', fontWeight:'600', marginBottom:'8px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Delivery Method</label>
                                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                                        {[
                                            { value:'webhook', icon:<Globe size={15}/>, label:'HTTP Webhook', sub:'POST to your URL', color:'var(--primary)' },
                                            { value:'email',   icon:<Mail size={15}/>,  label:'Email Notify', sub:'Send to Gmail',  color:'#10b981' },
                                        ].map(opt => (
                                            <button key={opt.value} type="button" onClick={() => { setForm({...form, notification_type:opt.value}); setUrlTest({status:'idle',msg:''}); }} style={{
                                                padding:'12px', borderRadius:'10px', cursor:'pointer',
                                                display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
                                                background: form.notification_type === opt.value ? opt.color+'18' : 'var(--bg-card2)',
                                                border: `1px solid ${form.notification_type === opt.value ? opt.color : 'var(--border)'}`,
                                                transition:'all 0.15s',
                                            }}>
                                                <div style={{color: form.notification_type === opt.value ? opt.color : 'var(--text-muted)'}}>{opt.icon}</div>
                                                <div style={{fontSize:'12px', fontWeight:'700', color: form.notification_type === opt.value ? opt.color : 'var(--text)' }}>{opt.label}</div>
                                                <div style={{fontSize:'10px', color:'var(--text-muted)'}}>{opt.sub}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Webhook URL + Test */}
                                {form.notification_type === 'webhook' && (
                                    <div style={{marginBottom:'16px'}}>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:'600', marginBottom:'6px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Webhook URL *</label>
                                        <div style={{display:'flex', gap:'8px', alignItems:'stretch'}}>
                                            <input placeholder="https://your-server.com/webhook" value={form.url}
                                                onChange={e => { setForm({...form, url:e.target.value}); setUrlTest({status:'idle',msg:''}); }}
                                                style={{flex:1}}/>
                                            {/* Test Button */}
                                            <button type="button" onClick={testUrl} disabled={!form.url || urlTest.status === 'testing'} style={{
                                                padding:'0 14px', borderRadius:'8px', cursor: form.url ? 'pointer' : 'not-allowed',
                                                border:`1px solid ${testBtnColor}`,
                                                background: urlTest.status === 'ok' ? '#10b98118' : urlTest.status === 'fail' ? '#ef444418' : 'var(--bg-card2)',
                                                color: testBtnColor, fontSize:'12px', fontWeight:'700',
                                                display:'flex', alignItems:'center', gap:'5px', flexShrink:0, transition:'all 0.2s',
                                                whiteSpace:'nowrap',
                                            }}>
                                                {urlTest.status === 'testing' ? <Loader size={13} style={{animation:'spin 1s linear infinite'}}/> :
                                                 urlTest.status === 'ok'      ? <CheckCircle2 size={13}/> :
                                                 urlTest.status === 'fail'    ? <AlertCircle size={13}/> :
                                                 <Globe size={13}/>}
                                                {urlTest.status === 'testing' ? 'Testing...' :
                                                 urlTest.status === 'ok'      ? urlTest.msg :
                                                 urlTest.status === 'fail'    ? urlTest.msg : 'Test'}
                                            </button>
                                        </div>

                                        {/* Test result message */}
                                        {urlTest.status !== 'idle' && urlTest.status !== 'testing' && (
                                            <div style={{
                                                marginTop:'8px', padding:'8px 12px', borderRadius:'7px', fontSize:'12px',
                                                background: urlTest.status === 'ok' ? '#10b98115' : '#ef444415',
                                                color: urlTest.status === 'ok' ? '#10b981' : '#ef4444',
                                                border:`1px solid ${urlTest.status === 'ok' ? '#10b98130' : '#ef444430'}`,
                                                display:'flex', alignItems:'center', gap:'6px',
                                            }}>
                                                {urlTest.status === 'ok' ? <CheckCircle2 size={13}/> : <AlertCircle size={13}/>}
                                                {urlTest.status === 'ok' ? 'Endpoint is reachable and accepted the test payload!' : `Endpoint unreachable or returned error (${urlTest.msg}). Check your URL.`}
                                            </div>
                                        )}

                                        {/* Payload preview */}
                                        <div style={{background:'#0a0a0f', border:'1px solid var(--border)', borderRadius:'8px', padding:'12px', marginTop:'10px'}}>
                                            <div style={{fontSize:'10px', color:'var(--text-muted)', marginBottom:'6px', fontWeight:'700', letterSpacing:'1px'}}>PAYLOAD FORMAT</div>
                                            <pre style={{fontSize:'10px', color:'#a5b4fc', lineHeight:1.8, margin:0, overflow:'auto'}}>{`{
  "webhookId": "wh_xxx",
  "type": "ADDRESS_ACTIVITY",
  "event": {
    "network": "VDCHAIN_MAINNET",
    "activity": [{ "hash":"0x...", "value":10.5, "asset":"VDC" }]
  }
}`}</pre>
                                        </div>
                                    </div>
                                )}

                                {/* Email Addresses */}
                                {form.notification_type === 'email' && (
                                    <div style={{marginBottom:'16px'}}>
                                        <label style={{display:'block', fontSize:'12px', fontWeight:'600', marginBottom:'6px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Email Addresses *</label>
                                        <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                                            <input placeholder="user@gmail.com" value={emailInput}
                                                onChange={e => setEmailInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                                                style={{flex:1}}/>
                                            <button type="button" onClick={addEmail} style={{
                                                padding:'10px 14px', background:'var(--primary)', color:'white',
                                                border:'none', borderRadius:'8px', cursor:'pointer', flexShrink:0,
                                                display:'flex', alignItems:'center',
                                            }}>
                                                <Plus size={15}/>
                                            </button>
                                        </div>
                                        {form.email_addresses.length > 0 && (
                                            <div style={{background:'var(--bg-card2)', borderRadius:'10px', padding:'8px', border:'1px solid var(--border)'}}>
                                                {form.email_addresses.map((email, i) => (
                                                    <div key={i} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', borderRadius:'7px'}}>
                                                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                                            <Mail size={13} color="#10b981"/>
                                                            <span style={{fontSize:'13px', color:'var(--text)'}}>{email}</span>
                                                        </div>
                                                        <button type="button" onClick={() => removeEmail(email)} style={{background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:'2px'}}>
                                                            <X size={14}/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'8px', padding:'8px 10px', background:'var(--bg-card2)', borderRadius:'7px', border:'1px solid var(--border)'}}>
                                            💡 <strong style={{color:'var(--text)'}}>{form.email_addresses.length} email{form.email_addresses.length !== 1 ? 's' : ''}</strong> = <strong style={{color:'var(--primary)'}}>{form.email_addresses.length} credit{form.email_addresses.length !== 1 ? 's' : ''}</strong> per transaction
                                        </div>
                                    </div>
                                )}

                                <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                                    <button type="submit" className="btn-primary" style={{flex:1, padding:'12px'}} disabled={creating}>
                                        {creating ? 'Creating...' : 'Create Webhook'}
                                    </button>
                                    <button type="button" onClick={closeModal} className="btn-outline" style={{padding:'12px 18px'}}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'80px', color:'var(--text-muted)'}}>
                    <div style={{textAlign:'center'}}>
                        <div style={{width:'32px', height:'32px', border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px'}}/>
                        Loading...
                    </div>
                </div>
            ) : webhooks.length === 0 ? (
                <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'16px', padding:'60px 24px', textAlign:'center'}}>
                    <div style={{width:'64px', height:'64px', background:'var(--bg-card2)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
                        <Webhook size={28} color="var(--text-muted)"/>
                    </div>
                    <h3 style={{fontSize:'17px', fontWeight:'700', marginBottom:'8px', color:'var(--text)'}}>No webhooks yet</h3>
                    <p style={{color:'var(--text-muted)', fontSize:'14px', marginBottom:'24px', maxWidth:'320px', margin:'0 auto 24px', lineHeight:1.6}}>Create your first webhook to start receiving real-time notifications</p>
                    <button className="btn-primary" onClick={() => setShowCreate(true)} style={{padding:'11px 24px'}}>
                        <Plus size={15} style={{marginRight:'6px', verticalAlign:'middle'}}/>
                        Create Your First Webhook
                    </button>
                </div>
            ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {webhooks.map(w => (
                        <div key={w.id} style={{
                            background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px',
                            padding:'16px 20px', transition:'all 0.15s',
                        }}
                        onMouseOver={e=>e.currentTarget.style.borderColor='var(--primary)'}
                        onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}>
                            <div style={{display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap'}}>

                                {/* Icon */}
                                <div style={{width:'42px', height:'42px', borderRadius:'10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                                    background: w.notification_type === 'email' ? '#10b98118' : '#6366f118'}}>
                                    {w.notification_type === 'email' ? <Mail size={18} color="#10b981"/> : <Webhook size={18} color="#818cf8"/>}
                                </div>

                                {/* Info */}
                                <div style={{flex:1, minWidth:'180px'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px'}}>
                                        <span style={{fontWeight:'700', fontSize:'15px', color:'var(--text)'}}>{w.name}</span>
                                        <span className={`badge-${w.status}`}>{w.status}</span>
                                        <span style={{
                                            background: w.notification_type === 'email' ? '#10b98118' : '#6366f118',
                                            color: w.notification_type === 'email' ? '#10b981' : '#818cf8',
                                            padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'600',
                                        }}>
                                            {w.notification_type === 'email' ? '📧 Email' : '🌐 HTTP'}
                                        </span>
                                    </div>
                                    <div style={{display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px'}}>
                                        <code style={{fontSize:'11px', color:'var(--text-muted)', background:'var(--bg-card2)', padding:'2px 8px', borderRadius:'4px', letterSpacing:'0.3px'}}>{w.webhook_id}</code>
                                        <button onClick={() => copyText(w.webhook_id)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px', display:'flex', alignItems:'center'}}>
                                            {copied === w.webhook_id ? <Check size={12} color="#10b981"/> : <Copy size={12}/>}
                                        </button>
                                    </div>
                                    <div style={{fontSize:'12px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'300px'}}>
                                        {w.notification_type === 'email'
                                            ? `${getEmailCount(w)} email address${getEmailCount(w) !== 1 ? 'es' : ''} registered`
                                            : w.url || 'No URL set'}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{display:'flex', gap:'8px', alignItems:'center', flexShrink:0}}>
                                    <div style={{textAlign:'center', padding:'8px 12px', background:'var(--bg-card2)', borderRadius:'10px', minWidth:'52px'}}>
                                        <div style={{fontSize:'17px', fontWeight:'800', color:'var(--text)'}}>{w.total_fired}</div>
                                        <div style={{fontSize:'10px', color:'var(--text-muted)'}}>Fired</div>
                                    </div>
                                    <div style={{textAlign:'center', padding:'8px 12px', background:'var(--bg-card2)', borderRadius:'10px', minWidth:'52px'}}>
                                        <div style={{fontSize:'17px', fontWeight:'800', color:'#10b981'}}>{w.address_count}</div>
                                        <div style={{fontSize:'10px', color:'var(--text-muted)'}}>Addrs</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                                    <Link to={`/webhooks/${w.id}`} style={{textDecoration:'none'}}>
                                        <button style={{display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', border:'1px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:'13px', fontWeight:'500', transition:'all 0.15s'}}
                                            onMouseOver={e=>{e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)'}}
                                            onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text)'}}>
                                            <ExternalLink size={13}/> Details
                                        </button>
                                    </Link>
                                    <button onClick={() => deleteWebhook(w.id)} style={{padding:'8px', borderRadius:'8px', background:'#ef444415', border:'1px solid #ef444430', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s'}}
                                        onMouseOver={e=>e.currentTarget.style.background='#ef444425'}
                                        onMouseOut={e=>e.currentTarget.style.background='#ef444415'}>
                                        <Trash2 size={15}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}
