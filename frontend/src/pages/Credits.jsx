import { useState, useEffect, useRef } from 'react';
import { CreditCard, CheckCircle, Zap, RefreshCw, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const PLANS = [
    { id:'starter', name:'Starter',  credits:10000,  amount:'$1.20',  amountUSD:1.20,  per:'$0.00012/credit'  },
    { id:'growth',  name:'Growth',   credits:50000,  amount:'$3.60',  amountUSD:3.60,  per:'$0.000072/credit', popular:true },
    { id:'scale',   name:'Scale',    credits:200000, amount:'$12.00', amountUSD:12.00, per:'$0.00006/credit'  },
];

export default function Credits() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState('');
    const [orders, setOrders] = useState([]);
    const [payModal, setPayModal] = useState(null); // { payment_id, address, amount, qr_code, expiry }
    const pollRef = useRef(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            api.get('/api/credits'),
            api.get('/api/payments/history'),
        ]).then(([cRes, pRes]) => {
            setData(cRes.data);
            setOrders(pRes.data.orders || []);
        }).catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // Cleanup poll on unmount
    useEffect(() => () => { if(pollRef.current) clearInterval(pollRef.current); }, []);

    const startPolling = (paymentId) => {
        if (pollRef.current) clearInterval(pollRef.current);
        let attempts = 0;
        pollRef.current = setInterval(async () => {
            attempts++;
            if (attempts > 60) {
                clearInterval(pollRef.current);
                return;
            }
            try {
                const res = await api.get(`/api/payments/check/${paymentId}`);
                if (res.data.status === 'completed') {
                    clearInterval(pollRef.current);
                    setPayModal(null);
                    toast.success('🎉 Payment confirmed! Credits added to your account!');
                    load();
                }
            } catch(e) {}
        }, 4000);
    };

    const buyCredits = async (plan) => {
        setBuying(plan.id);
        try {
            const res = await api.post('/api/payments/create', { plan_id: plan.id });
            const p = res.data;

            // Show custom payment modal
            setPayModal({
                payment_id: p.payment_id,
                address: p.address,
                amount: p.amount,
                qr_code: p.qr_code,
                expiry_minutes: p.expiry_minutes,
                checkout_page: p.checkout_page,
                credits: plan.credits,
                plan_name: plan.name,
            });

            // Start polling
            startPolling(p.payment_id);

        } catch(err) {
            toast.error(err.response?.data?.error || 'Failed to create payment');
        } finally { setBuying(''); }
    };

    const closeModal = () => {
        setPayModal(null);
        if (pollRef.current) clearInterval(pollRef.current);
        load();
    };

    const copyAddress = async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.position='fixed'; ta.style.left='-9999px';
                document.body.appendChild(ta); ta.focus(); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
            }
            toast.success('Copied!');
        } catch(e) { toast.error('Copy failed'); }
    };

    const balance = Number(data?.credit_balance || 0);
    const lowCredits = balance < 100;

    if (loading) return (
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'60vh'}}>
            <div style={{textAlign:'center'}}>
                <div style={{width:'36px', height:'36px', border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px'}}/>
                <div style={{color:'var(--text-muted)', fontSize:'14px'}}>Loading...</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{maxWidth:'860px'}}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

            {/* Payment Modal */}
            {payModal && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
                    <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'16px', width:'100%', maxWidth:'420px', overflow:'hidden'}}>
                        {/* Header */}
                        <div style={{background:'linear-gradient(135deg,#1a0533,#0d1b6e)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                            <div>
                                <div style={{color:'white', fontWeight:'800', fontSize:'16px'}}>Pay with USDT</div>
                                <div style={{color:'rgba(255,255,255,0.6)', fontSize:'12px', marginTop:'2px'}}>{payModal.plan_name} — {Number(payModal.credits).toLocaleString()} credits</div>
                            </div>
                            <button onClick={closeModal} style={{background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', padding:'6px', cursor:'pointer', color:'white', display:'flex', alignItems:'center'}}>
                                <X size={16}/>
                            </button>
                        </div>

                        <div style={{padding:'20px 24px'}}>
                            {/* Amount */}
                            <div style={{textAlign:'center', marginBottom:'16px'}}>
                                <div style={{fontSize:'36px', fontWeight:'900', color:'var(--primary)'}}>${payModal.amount}</div>
                                <div style={{fontSize:'13px', color:'var(--text-muted)'}}>USDT BEP-20 (BSC Network)</div>
                            </div>

                            {/* QR Code */}
                            {payModal.qr_code && (
                                <div style={{textAlign:'center', marginBottom:'16px'}}>
                                    <img src={payModal.qr_code} alt="QR Code" style={{width:'160px', height:'160px', borderRadius:'10px', border:'2px solid var(--border)'}}
                                        onError={e=>e.target.style.display='none'}/>
                                </div>
                            )}

                            {/* Address */}
                            <div style={{marginBottom:'16px'}}>
                                <div style={{fontSize:'11px', color:'var(--text-muted)', fontWeight:'600', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>Send To Address (BSC)</div>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <code style={{flex:1, fontSize:'11px', background:'var(--bg-card2)', padding:'8px 10px', borderRadius:'7px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', border:'1px solid var(--border)', color:'var(--text)'}}>
                                        {payModal.address}
                                    </code>
                                    <button onClick={() => copyAddress(payModal.address)} style={{background:'var(--primary)', border:'none', borderRadius:'7px', padding:'8px 10px', cursor:'pointer', color:'white', fontSize:'11px', fontWeight:'700', flexShrink:0, whiteSpace:'nowrap'}}>
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {/* Amount copy */}
                            <div style={{marginBottom:'16px'}}>
                                <div style={{fontSize:'11px', color:'var(--text-muted)', fontWeight:'600', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>Exact Amount</div>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <code style={{flex:1, fontSize:'13px', background:'var(--bg-card2)', padding:'8px 10px', borderRadius:'7px', border:'1px solid #f59e0b40', color:'#f59e0b', fontWeight:'700'}}>
                                        {payModal.amount} USDT
                                    </code>
                                    <button onClick={() => copyAddress(String(payModal.amount))} style={{background:'#f59e0b', border:'none', borderRadius:'7px', padding:'8px 10px', cursor:'pointer', color:'white', fontSize:'11px', fontWeight:'700', flexShrink:0}}>
                                        Copy
                                    </button>
                                </div>
                                <div style={{fontSize:'11px', color:'#f59e0b', marginTop:'4px'}}>⚠️ Send exact amount including decimals</div>
                            </div>

                            {/* Processing indicator */}
                            <div style={{background:'#6366f110', border:'1px solid #6366f130', borderRadius:'10px', padding:'12px', textAlign:'center', marginBottom:'16px'}}>
                                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'4px'}}>
                                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981', animation:'pulse 1.5s ease-in-out infinite'}}/>
                                    <span style={{fontSize:'13px', fontWeight:'600', color:'var(--text)'}}>Waiting for payment...</span>
                                </div>
                                <div style={{fontSize:'11px', color:'var(--text-muted)'}}>Credits will be added automatically after confirmation</div>
                            </div>

                            {/* Checkout page link */}
                            <a href={payModal.checkout_page} target="_blank" rel="noopener noreferrer" style={{
                                display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                                width:'100%', padding:'10px', borderRadius:'8px', textDecoration:'none',
                                border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:'13px',
                                background:'var(--bg-card2)',
                            }}>
                                <ExternalLink size={13}/> Open Full Payment Page
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'10px'}}>
                <div>
                    <h1 style={{fontSize:'clamp(20px,3vw,26px)', fontWeight:'800', marginBottom:'4px', color:'var(--text)', letterSpacing:'-0.5px'}}>Credits</h1>
                    <p style={{color:'var(--text-muted)', fontSize:'14px'}}>Purchase credits to send notifications</p>
                </div>
                <button onClick={load} style={{display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-muted)', cursor:'pointer', fontSize:'12px'}}>
                    <RefreshCw size={13}/> Refresh
                </button>
            </div>

            {/* Balance Card */}
            <div style={{
                background: lowCredits ? 'linear-gradient(135deg,#ef444415,#f59e0b10)' : 'linear-gradient(135deg,#f59e0b15,#6366f110)',
                border:`1px solid ${lowCredits ? '#ef444430' : '#f59e0b30'}`,
                borderRadius:'16px', padding:'24px', marginBottom:'20px',
                display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap',
            }}>
                <div style={{width:'60px', height:'60px', flexShrink:0, background: lowCredits ? '#ef444420' : '#f59e0b20', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <CreditCard size={26} color={lowCredits ? '#ef4444' : '#f59e0b'}/>
                </div>
                <div style={{flex:1}}>
                    <div style={{fontSize:'clamp(28px,5vw,42px)', fontWeight:'900', color: lowCredits ? '#ef4444' : '#f59e0b', lineHeight:1}}>
                        {balance.toLocaleString()}
                    </div>
                    <div style={{fontSize:'14px', color:'var(--text-muted)', marginTop:'4px'}}>Credits remaining</div>
                    {data?.credits_reset_at && (
                        <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'4px'}}>
                            Monthly reset: {new Date(data.credits_reset_at).toLocaleDateString('en', {day:'numeric', month:'short', year:'numeric'})}
                        </div>
                    )}
                </div>
                {lowCredits && (
                    <div style={{background:'#ef444415', border:'1px solid #ef444430', borderRadius:'10px', padding:'10px 14px', fontSize:'12px', color:'#ef4444', fontWeight:'600'}}>
                        ⚠️ Low credits!<br/><span style={{fontWeight:'400'}}>Purchase more below</span>
                    </div>
                )}
            </div>

            {/* Plans */}
            <div style={{marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px'}}>
                <h2 style={{fontSize:'16px', fontWeight:'700', color:'var(--text)'}}>Purchase Credits</h2>
                <div style={{fontSize:'12px', color:'var(--text-muted)'}}>Powered by RazCrypto · USDT (BSC)</div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'14px', marginBottom:'28px'}}>
                {PLANS.map((p,i) => (
                    <div key={i} style={{
                        background:'var(--bg-card)', position:'relative',
                        border:`1px solid ${p.popular ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius:'14px', padding:'20px', textAlign:'center',
                        transition:'transform 0.2s, border-color 0.2s',
                    }}
                    onMouseOver={e=>{e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor='var(--primary)'}}
                    onMouseOut={e=>{e.currentTarget.style.transform='none'; if(!p.popular) e.currentTarget.style.borderColor='var(--border)'}}>
                        {p.popular && (
                            <div style={{position:'absolute', top:'-11px', left:'50%', transform:'translateX(-50%)', background:'linear-gradient(90deg,#6366f1,#818cf8)', color:'white', padding:'3px 14px', borderRadius:'20px', fontSize:'10px', fontWeight:'800', whiteSpace:'nowrap'}}>
                                BEST VALUE
                            </div>
                        )}
                        <div style={{fontSize:'14px', fontWeight:'700', color:'var(--text)', marginBottom:'6px'}}>{p.name}</div>
                        <div style={{fontSize:'28px', fontWeight:'900', color:'var(--primary)', marginBottom:'2px'}}>{p.amount}</div>
                        <div style={{fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px'}}>USDT on BSC</div>
                        <div style={{fontSize:'20px', fontWeight:'700', color:'var(--text)', marginBottom:'2px'}}>{Number(p.credits).toLocaleString()}</div>
                        <div style={{fontSize:'11px', color:'var(--text-muted)', marginBottom:'18px'}}>credits · {p.per}</div>
                        <button onClick={() => buyCredits(p)} disabled={!!buying} style={{
                            width:'100%', padding:'10px', borderRadius:'8px', cursor: buying ? 'not-allowed' : 'pointer',
                            background: p.popular ? 'var(--primary)' : 'transparent',
                            color: p.popular ? 'white' : 'var(--primary)',
                            border: p.popular ? 'none' : '1px solid var(--primary)',
                            fontSize:'13px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
                            opacity: buying && buying !== p.id ? 0.5 : 1,
                        }}>
                            {buying === p.id ? (
                                <><div style={{width:'12px', height:'12px', border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite'}}/> Creating...</>
                            ) : (
                                <>Buy Credits</>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Credit History */}
            <h2 style={{fontSize:'16px', fontWeight:'700', color:'var(--text)', marginBottom:'14px'}}>Credit History</h2>
            <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px'}}>
                {!data?.history?.length ? (
                    <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>
                        <div style={{fontSize:'28px', marginBottom:'8px'}}>💳</div>
                        <div style={{fontSize:'13px', fontWeight:'600'}}>No credit transactions yet</div>
                    </div>
                ) : data.history.map((h,i) => (
                    <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px 18px', borderBottom: i < data.history.length-1 ? '1px solid var(--border)' : 'none'}}
                    onMouseOver={e=>e.currentTarget.style.background='var(--bg-card2)'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{width:'34px', height:'34px', borderRadius:'9px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: h.amount > 0 ? '#10b98118' : '#ef444418'}}>
                            {h.amount > 0 ? <CheckCircle size={15} color="#10b981"/> : <Zap size={15} color="#ef4444"/>}
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                            <div style={{fontSize:'13px', fontWeight:'600', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{h.description || h.type}</div>
                            <div style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px'}}>{new Date(h.created_at).toLocaleString('en', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div style={{textAlign:'right', flexShrink:0}}>
                            <div style={{fontSize:'14px', fontWeight:'800', color: h.amount > 0 ? '#10b981' : '#ef4444'}}>{h.amount > 0 ? '+' : ''}{h.amount}</div>
                            <div style={{fontSize:'10px', color:'var(--text-muted)', marginTop:'2px'}}>bal: {Number(h.balance).toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Orders */}
            {orders.length > 0 && (
                <>
                    <h2 style={{fontSize:'16px', fontWeight:'700', color:'var(--text)', marginBottom:'14px'}}>Payment Orders</h2>
                    <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden'}}>
                        {orders.map((o,i) => (
                            <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px 18px', borderBottom: i < orders.length-1 ? '1px solid var(--border)' : 'none', flexWrap:'wrap'}}
                            onMouseOver={e=>e.currentTarget.style.background='var(--bg-card2)'}
                            onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                                <div style={{flex:1, minWidth:'150px'}}>
                                    <div style={{fontSize:'12px', fontWeight:'600', color:'var(--text)'}}>+{Number(o.credits).toLocaleString()} credits</div>
                                    <div style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px'}}>{o.payment_id}</div>
                                </div>
                                <div style={{fontSize:'13px', fontWeight:'700', color:'var(--primary)'}}>${o.amount}</div>
                                <span style={{
                                    padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700',
                                    background: o.status === 'completed' ? '#10b98118' : o.status === 'pending' ? '#f59e0b18' : '#ef444418',
                                    color: o.status === 'completed' ? '#10b981' : o.status === 'pending' ? '#f59e0b' : '#ef4444',
                                }}>{o.status}</span>
                                <div style={{fontSize:'11px', color:'var(--text-muted)'}}>{new Date(o.created_at).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
