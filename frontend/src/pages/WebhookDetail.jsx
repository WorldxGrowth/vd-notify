import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Copy, Check, Eye, EyeOff, RefreshCw, Mail, Globe, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

// Copy function — works without HTTPS too
const copyToClipboard = async (text, label) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for HTTP
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        toast.success(label ? `${label} copied!` : 'Copied!');
        return true;
    } catch(e) {
        toast.error('Copy failed');
        return false;
    }
};

export default function WebhookDetail() {
    const { id } = useParams();
    const [webhook, setWebhook] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAddr, setNewAddr] = useState('');
    const [adding, setAdding] = useState(false);
    const [copied, setCopied] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [activeTab, setActiveTab] = useState('addresses');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => { loadAll(); }, [id]);

    const loadAll = async () => {
        try {
            const [wRes, aRes, lRes, sRes] = await Promise.all([
                api.get(`/api/webhooks/${id}`),
                api.get(`/api/webhooks/${id}/addresses`),
                api.get(`/api/webhooks/${id}/logs?limit=30`),
                api.get(`/api/stats/webhook/${id}`),
            ]);
            setWebhook(wRes.data.webhook);
            setAddresses(aRes.data.addresses);
            setLogs(lRes.data.logs);
            setStats([...sRes.data.stats].reverse());
        } catch(e) { toast.error('Failed to load'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const refresh = async () => { setRefreshing(true); await loadAll(); };

    const copy = async (text, label) => {
        const ok = await copyToClipboard(text, label);
        if (ok) {
            setCopied(text);
            setTimeout(() => setCopied(''), 2000);
        }
    };

    const addAddress = async (e) => {
        e.preventDefault();
        if (!newAddr.match(/^0x[0-9a-fA-F]{40}$/)) return toast.error('Invalid address');
        setAdding(true);
        try {
            await api.patch(`/api/webhooks/${id}/addresses`, { addresses_to_add: [newAddr] });
            toast.success('Address added!');
            setNewAddr('');
            const r = await api.get(`/api/webhooks/${id}/addresses`);
            setAddresses(r.data.addresses);
        } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
        finally { setAdding(false); }
    };

    const removeAddress = async (addr) => {
        if (!confirm('Remove this address?')) return;
        try {
            await api.patch(`/api/webhooks/${id}/addresses`, { addresses_to_remove: [addr] });
            toast.success('Removed');
            setAddresses(addresses.filter(a => a.address !== addr));
        } catch(e) { toast.error('Failed'); }
    };

    const shortText = (text) => text ? text.substring(0,8)+'...'+text.slice(-6) : '';

    const getEmailList = () => {
        try {
            const arr = typeof webhook.email_addresses === 'string'
                ? JSON.parse(webhook.email_addresses) : webhook.email_addresses;
            return Array.isArray(arr) ? arr : [];
        } catch { return []; }
    };

    if (loading) return (
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'60vh'}}>
            <div style={{textAlign:'center'}}>
                <div style={{width:'36px', height:'36px', border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px'}}/>
                <div style={{color:'var(--text-muted)', fontSize:'14px'}}>Loading...</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (!webhook) return (
        <div style={{textAlign:'center', padding:'60px'}}>
            <div style={{color:'var(--error)', fontSize:'15px', marginBottom:'16px'}}>Webhook not found</div>
            <Link to="/webhooks" style={{color:'var(--primary)', textDecoration:'none'}}>← Back</Link>
        </div>
    );

    const chartData = stats.map(s => ({
        date: new Date(s.date).toLocaleDateString('en', {month:'short', day:'numeric'}),
        success: parseInt(s.success_200) || 0,
        failed: (parseInt(s.error_4xx)||0) + (parseInt(s.error_5xx)||0),
    }));

    const isEmail = webhook.notification_type === 'email';
    const emailList = getEmailList();
    const successRate = webhook.total_fired > 0
        ? Math.round((webhook.total_success / webhook.total_fired) * 100) : 100;

    const CopyBtn = ({ text, label }) => (
        <button
            onClick={() => copy(text, label)}
            title={`Copy ${label || ''}`}
            style={{
                background: copied === text ? '#10b98120' : 'var(--bg-card2)',
                border: `1px solid ${copied === text ? '#10b98150' : 'var(--border)'}`,
                borderRadius:'6px', padding:'6px 8px', cursor:'pointer',
                color: copied === text ? '#10b981' : 'var(--text-muted)',
                flexShrink:0, display:'flex', alignItems:'center', gap:'4px',
                fontSize:'11px', fontWeight:'600', transition:'all 0.15s',
            }}>
            {copied === text ? <><Check size={12}/> Copied!</> : <><Copy size={12}/> Copy</>}
        </button>
    );

    return (
        <div style={{width:'100%', maxWidth:'860px'}}>
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
            `}</style>

            {/* Top Bar */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px', gap:'8px'}}>
                <Link to="/webhooks" style={{
                    display:'inline-flex', alignItems:'center', gap:'5px',
                    color:'var(--text-muted)', textDecoration:'none', fontSize:'13px', fontWeight:'500',
                    padding:'7px 12px', borderRadius:'8px', border:'1px solid var(--border)',
                    background:'var(--bg-card)', whiteSpace:'nowrap',
                }}>
                    <ArrowLeft size={14}/> Webhooks
                </Link>
                <button onClick={refresh} disabled={refreshing} style={{
                    display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px',
                    borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-card)',
                    color:'var(--text-muted)', cursor:'pointer', fontSize:'12px', whiteSpace:'nowrap',
                }}>
                    <RefreshCw size={13} style={{animation: refreshing ? 'spin 0.8s linear infinite' : 'none'}}/>
                    Refresh
                </button>
            </div>

            {/* Header Card */}
            <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px 18px', marginBottom:'16px'}}>
                {/* Name + badges */}
                <div style={{display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'14px'}}>
                    <div style={{width:'34px', height:'34px', borderRadius:'9px', flexShrink:0,
                        background: isEmail ? '#10b98118' : '#6366f118',
                        display:'flex', alignItems:'center', justifyContent:'center'}}>
                        {isEmail ? <Mail size={16} color="#10b981"/> : <Globe size={16} color="#818cf8"/>}
                    </div>
                    <span style={{fontWeight:'800', fontSize:'clamp(15px,3vw,20px)', color:'var(--text)'}}>{webhook.name}</span>
                    <span className={`badge-${webhook.status}`}>{webhook.status}</span>
                    <span style={{
                        background: isEmail ? '#10b98118' : '#6366f118',
                        color: isEmail ? '#10b981' : '#818cf8',
                        padding:'2px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700',
                    }}>{isEmail ? '📧 Email' : '🌐 HTTP'}</span>
                </div>

                {/* Webhook ID row */}
                <div style={{marginBottom:'8px'}}>
                    <div style={{fontSize:'10px', color:'var(--text-muted)', fontWeight:'700', letterSpacing:'0.5px', marginBottom:'5px', textTransform:'uppercase'}}>Webhook ID</div>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <code style={{
                            flex:1, fontSize:'12px', background:'var(--bg-card2)', padding:'7px 10px',
                            borderRadius:'7px', color:'var(--text)', border:'1px solid var(--border)',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0,
                        }} className="full-on-desktop short-on-mobile"
                        data-full={webhook.webhook_id}
                        data-short={shortText(webhook.webhook_id)}>
                            <span className="full-text">{webhook.webhook_id}</span>
                            <span className="short-text" style={{display:'none'}}>{shortText(webhook.webhook_id)}</span>
                        </code>
                        <CopyBtn text={webhook.webhook_id} label="Webhook ID"/>
                    </div>
                </div>

                {/* Signing Key row — HTTP only */}
                {!isEmail && (
                    <div>
                        <div style={{fontSize:'10px', color:'#f59e0b', fontWeight:'700', letterSpacing:'0.5px', marginBottom:'5px', textTransform:'uppercase'}}>Signing Key <span style={{color:'var(--text-muted)', fontWeight:'500'}}>— Keep private</span></div>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <code style={{
                                flex:1, fontSize:'12px', background:'var(--bg-card2)', padding:'7px 10px',
                                borderRadius:'7px', color:'var(--text)', border:'1px solid #f59e0b30',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0,
                            }}>
                                {showKey ? webhook.signing_key : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                            </code>
                            <button onClick={() => setShowKey(!showKey)} style={{
                                background:'var(--bg-card2)', border:'1px solid var(--border)',
                                borderRadius:'6px', padding:'6px 8px', cursor:'pointer',
                                color:'var(--text-muted)', flexShrink:0, display:'flex', alignItems:'center',
                                fontSize:'11px', gap:'4px',
                            }}>
                                {showKey ? <><EyeOff size={12}/> Hide</> : <><Eye size={12}/> Show</>}
                            </button>
                            <CopyBtn text={webhook.signing_key} label="Signing Key"/>
                        </div>
                    </div>
                )}
            </div>

            {/* Stat Cards */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px'}} className="detail-stats">
                {[
                    { label:'Fired', value: webhook.total_fired, color:'#6366f1', icon:<Zap size={14}/> },
                    { label:'Success', value: webhook.total_success, color:'#10b981', icon:<CheckCircle size={14}/> },
                    { label:'Failed', value: webhook.total_failed, color:'#ef4444', icon:<XCircle size={14}/> },
                    { label:'Addrs', value: addresses.length, color:'#f59e0b', icon:<Clock size={14}/> },
                ].map((s,i) => (
                    <div key={i} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 14px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:'5px', marginBottom:'6px'}}>
                            <span style={{color:s.color}}>{s.icon}</span>
                            <span style={{fontSize:'10px', color:'var(--text-muted)', fontWeight:'600'}}>{s.label}</span>
                        </div>
                        <div style={{fontSize:'clamp(16px,3vw,22px)', fontWeight:'800', color:s.color}}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Config Card */}
            <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px 18px', marginBottom:'16px'}}>
                <div style={{fontSize:'10px', color:'var(--text-muted)', fontWeight:'700', letterSpacing:'1px', marginBottom:'12px', textTransform:'uppercase'}}>Config</div>

                {/* Success Rate */}
                <div style={{marginBottom:'14px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                        <span style={{fontSize:'12px', color:'var(--text-muted)'}}>Success Rate</span>
                        <span style={{fontSize:'12px', fontWeight:'700', color: successRate >= 80 ? '#10b981' : '#f59e0b'}}>{successRate}%</span>
                    </div>
                    <div style={{height:'5px', background:'var(--bg-card2)', borderRadius:'3px', overflow:'hidden'}}>
                        <div style={{height:'100%', width:`${successRate}%`, background: successRate >= 80 ? '#10b981' : '#f59e0b', borderRadius:'3px'}}/>
                    </div>
                </div>

                {/* URL */}
                {!isEmail && (
                    <div>
                        <div style={{fontSize:'11px', color:'var(--text-muted)', marginBottom:'6px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>Webhook URL</div>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <code style={{
                                flex:1, fontSize:'11px', background:'var(--bg-card2)', padding:'8px 10px',
                                borderRadius:'7px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                color:'var(--text)', border:'1px solid var(--border)', minWidth:0,
                            }}>{webhook.url || 'Not set'}</code>
                            <CopyBtn text={webhook.url} label="URL"/>
                        </div>
                    </div>
                )}

                {/* Email list */}
                {isEmail && (
                    <div>
                        <div style={{fontSize:'11px', color:'var(--text-muted)', marginBottom:'8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>Email Recipients ({emailList.length})</div>
                        {emailList.map((email, i) => (
                            <div key={i} style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-card2)', borderRadius:'7px', padding:'7px 10px', marginBottom:'5px', gap:'8px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'7px', minWidth:0, flex:1}}>
                                    <Mail size={12} color="#10b981" style={{flexShrink:0}}/>
                                    <span style={{fontSize:'12px', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{email}</span>
                                </div>
                                <CopyBtn text={email} label="Email"/>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chart */}
            {chartData.some(d => d.success > 0 || d.failed > 0) && (
                <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px 18px', marginBottom:'16px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', flexWrap:'wrap', gap:'6px'}}>
                        <span style={{fontSize:'12px', fontWeight:'700', color:'var(--text)'}}>Usage — 30 Days</span>
                        <div style={{display:'flex', gap:'12px', fontSize:'10px', color:'var(--text-muted)'}}>
                            <span style={{display:'flex', alignItems:'center', gap:'3px'}}><span style={{width:'7px', height:'7px', borderRadius:'2px', background:'#10b981', display:'inline-block'}}/> Success</span>
                            <span style={{display:'flex', alignItems:'center', gap:'3px'}}><span style={{width:'7px', height:'7px', borderRadius:'2px', background:'#ef4444', display:'inline-block'}}/> Failed</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={chartData} margin={{top:0, right:0, left:-25, bottom:0}}>
                            <XAxis dataKey="date" stroke="var(--border)" tick={{fontSize:9, fill:'var(--text-muted)'}}/>
                            <YAxis stroke="var(--border)" tick={{fontSize:9, fill:'var(--text-muted)'}} allowDecimals={false}/>
                            <Tooltip contentStyle={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'11px', color:'var(--text)'}}/>
                            <Bar dataKey="success" fill="#10b981" radius={[3,3,0,0]}/>
                            <Bar dataKey="failed" fill="#ef4444" radius={[3,3,0,0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Tabs */}
            <div style={{display:'flex', gap:'4px', marginBottom:'12px', background:'var(--bg-card)', border:'1px solid var(--border)', padding:'3px', borderRadius:'11px', width:'fit-content'}}>
                {[
                    { key:'addresses', label:`Addresses (${addresses.length})` },
                    { key:'logs', label:`Logs (${logs.length})` },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        padding:'7px 16px', borderRadius:'9px', border:'none', cursor:'pointer',
                        background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                        color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                        fontSize:'12px', fontWeight:'600', transition:'all 0.15s', whiteSpace:'nowrap',
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* Addresses */}
            {activeTab === 'addresses' && (
                <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px 18px', animation:'fadeIn 0.2s ease'}}>
                    <form onSubmit={addAddress} style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
                        <input placeholder="0x... wallet address" value={newAddr}
                            onChange={e => setNewAddr(e.target.value)}
                            style={{flex:1, fontFamily:'monospace', fontSize:'12px', minWidth:0}} required/>
                        <button type="submit" style={{
                            display:'flex', alignItems:'center', gap:'5px', padding:'9px 14px',
                            background:'var(--primary)', color:'white', border:'none', borderRadius:'8px',
                            cursor:'pointer', fontSize:'12px', fontWeight:'600', flexShrink:0,
                        }} disabled={adding}>
                            <Plus size={14}/> {adding ? '...' : 'Add'}
                        </button>
                    </form>

                    {addresses.length === 0 ? (
                        <div style={{textAlign:'center', padding:'32px', color:'var(--text-muted)'}}>
                            <div style={{fontSize:'28px', marginBottom:'8px'}}>📭</div>
                            <div style={{fontSize:'13px'}}>No addresses yet</div>
                        </div>
                    ) : addresses.map((a,i) => (
                        <div key={i} style={{display:'flex', alignItems:'center', gap:'8px', padding:'9px 10px', borderRadius:'8px', marginBottom:'5px', background:'var(--bg-card2)'}}>
                            <code style={{fontSize:'11px', color:'var(--text)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{a.address}</code>
                            <CopyBtn text={a.address} label="Address"/>
                            <button onClick={() => removeAddress(a.address)} style={{background:'#ef444415', border:'1px solid #ef444430', borderRadius:'6px', padding:'6px 8px', cursor:'pointer', color:'#ef4444', flexShrink:0, display:'flex', alignItems:'center'}}>
                                <Trash2 size={12}/>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Logs */}
            {activeTab === 'logs' && (
                <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px 18px', animation:'fadeIn 0.2s ease'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                        <span style={{fontSize:'12px', color:'var(--text-muted)'}}>Last 30 notifications</span>
                        <button onClick={refresh} style={{display:'flex', alignItems:'center', gap:'4px', background:'none', border:'1px solid var(--border)', borderRadius:'6px', padding:'5px 9px', cursor:'pointer', color:'var(--text-muted)', fontSize:'11px'}}>
                            <RefreshCw size={12} style={{animation: refreshing ? 'spin 0.8s linear infinite' : 'none'}}/> Refresh
                        </button>
                    </div>

                    {logs.length === 0 ? (
                        <div style={{textAlign:'center', padding:'32px', color:'var(--text-muted)'}}>
                            <div style={{fontSize:'28px', marginBottom:'8px'}}>📋</div>
                            <div style={{fontSize:'13px'}}>No logs yet</div>
                        </div>
                    ) : logs.map((l,i) => (
                        <div key={i} style={{display:'flex', alignItems:'center', gap:'8px', padding:'9px 0', borderBottom: i < logs.length-1 ? '1px solid var(--border)' : 'none', flexWrap:'wrap'}}>
                            <span className={l.status === 'delivered' ? 'badge-active' : 'badge-failed'} style={{flexShrink:0, fontSize:'10px'}}>
                                {l.status === 'delivered' ? '✓ delivered' : '✗ failed'}
                            </span>
                            <code style={{fontSize:'10px', color:'var(--text-muted)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:'60px'}}>
                                {l.tx_hash ? l.tx_hash.substring(0,16)+'...' : l.event_id?.substring(0,18)}
                            </code>
                            <span style={{
                                fontSize:'10px', fontWeight:'700', flexShrink:0, padding:'2px 7px', borderRadius:'4px',
                                background: l.http_status === 200 ? '#10b98115' : l.http_status ? '#ef444415' : 'var(--bg-card2)',
                                color: l.http_status === 200 ? '#10b981' : l.http_status ? '#ef4444' : 'var(--text-muted)',
                            }}>{l.http_status || '—'}</span>
                            <span style={{fontSize:'10px', color:'var(--text-muted)', flexShrink:0}}>
                                {new Date(l.created_at).toLocaleString('en', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @media (max-width: 480px) {
                    .detail-stats { grid-template-columns: repeat(2,1fr) !important; }
                }
            `}</style>
        </div>
    );
}
