import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Webhook, CreditCard, ArrowRight, CheckCircle, XCircle, TrendingUp, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/stats/overview').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'60vh'}}>
            <div style={{textAlign:'center'}}>
                <div style={{width:'36px', height:'36px', border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px'}}></div>
                <div style={{color:'var(--text-muted)', fontSize:'14px'}}>Loading dashboard...</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    const chartData = stats?.last7days?.map(d => ({
        date: new Date(d.date).toLocaleDateString('en', {month:'short', day:'numeric'}),
        fired: parseInt(d.total_fired) || 0,
        success: parseInt(d.total_success) || 0,
        failed: parseInt(d.total_failed) || 0,
    })) || [];

    const successRate = stats?.today?.fired > 0
        ? Math.round((stats.today.success / stats.today.fired) * 100)
        : 100;

    const statCards = [
        { label:'Fired Today', value: stats?.today?.fired || 0, icon:<Zap size={18}/>, color:'#6366f1', bg:'#6366f1' },
        { label:'Success', value: stats?.today?.success || 0, icon:<CheckCircle size={18}/>, color:'#10b981', bg:'#10b981' },
        { label:'Failed', value: stats?.today?.failed || 0, icon:<XCircle size={18}/>, color:'#ef4444', bg:'#ef4444' },
        { label:'Credits Left', value: Number(stats?.credit_balance || 0).toLocaleString(), icon:<CreditCard size={18}/>, color:'#f59e0b', bg:'#f59e0b' },
    ];

    return (
        <div style={{maxWidth:'1000px'}}>
            {/* Header */}
            <div style={{marginBottom:'28px'}}>
                <h1 style={{fontSize:'clamp(20px,3vw,26px)', fontWeight:'800', marginBottom:'4px', color:'var(--text)', letterSpacing:'-0.5px'}}>
                    Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
                </h1>
                <p style={{color:'var(--text-muted)', fontSize:'14px'}}>Here's your notification overview for today</p>
            </div>

            {/* Stat Cards */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px'}} className="stat-cards">
                {statCards.map((s,i) => (
                    <div key={i} style={{
                        background:'var(--bg-card)', border:'1px solid var(--border)',
                        borderRadius:'14px', padding:'18px 16px',
                        transition:'all 0.2s', cursor:'default',
                    }}
                    onMouseOver={e=>{e.currentTarget.style.borderColor=s.color; e.currentTarget.style.transform='translateY(-2px)'}}
                    onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'}}>
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
                            <div style={{width:'36px', height:'36px', background:s.bg+'18', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', color:s.color}}>
                                {s.icon}
                            </div>
                        </div>
                        <div style={{fontSize:'clamp(20px,3vw,28px)', fontWeight:'800', color:'var(--text)', lineHeight:1}}>{s.value}</div>
                        <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'4px'}}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Chart + Success Rate Row */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 220px', gap:'16px', marginBottom:'24px', alignItems:'start'}} className="chart-row">

                {/* Chart */}
                <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'8px'}}>
                        <div>
                            <h2 style={{fontSize:'15px', fontWeight:'700', color:'var(--text)'}}>Notifications — Last 7 Days</h2>
                            <p style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'2px'}}>
                                {stats?.last30days?.fired || 0} total this month
                            </p>
                        </div>
                        <div style={{display:'flex', gap:'14px', fontSize:'12px', color:'var(--text-muted)'}}>
                            {[['#6366f1','Fired'],['#10b981','Success'],['#ef4444','Failed']].map(([c,l]) => (
                                <span key={l} style={{display:'flex', alignItems:'center', gap:'4px'}}>
                                    <span style={{width:'8px', height:'8px', borderRadius:'50%', background:c, display:'inline-block'}}/>
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>
                    {chartData.length > 0 && chartData.some(d => d.fired > 0) ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData} margin={{top:0, right:0, left:-20, bottom:0}}>
                                <defs>
                                    {[['fired','#6366f1'],['success','#10b981'],['failed','#ef4444']].map(([k,c]) => (
                                        <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={c} stopOpacity={0.25}/>
                                            <stop offset="95%" stopColor={c} stopOpacity={0}/>
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis dataKey="date" stroke="var(--border)" tick={{fontSize:10, fill:'var(--text-muted)'}}/>
                                <YAxis stroke="var(--border)" tick={{fontSize:10, fill:'var(--text-muted)'}} allowDecimals={false}/>
                                <Tooltip contentStyle={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'12px', color:'var(--text)'}}/>
                                <Area type="monotone" dataKey="fired"   stroke="#6366f1" fill="url(#grad_fired)"   strokeWidth={2}/>
                                <Area type="monotone" dataKey="success" stroke="#10b981" fill="url(#grad_success)" strokeWidth={2}/>
                                <Area type="monotone" dataKey="failed"  stroke="#ef4444" fill="url(#grad_failed)"  strokeWidth={2}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{height:'180px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', gap:'10px'}}>
                            <Activity size={32} color="var(--border)"/>
                            <div style={{fontSize:'13px', textAlign:'center'}}>No data yet<br/><span style={{fontSize:'12px'}}>Create a webhook to start tracking</span></div>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
                    {/* Success Rate */}
                    <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px', textAlign:'center'}}>
                        <div style={{fontSize:'12px', color:'var(--text-muted)', marginBottom:'12px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>Success Rate</div>
                        <div style={{position:'relative', width:'80px', height:'80px', margin:'0 auto 12px'}}>
                            <svg width="80" height="80" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="6"/>
                                <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="6"
                                    strokeDasharray={`${2*Math.PI*32*successRate/100} ${2*Math.PI*32}`}
                                    strokeLinecap="round" transform="rotate(-90 40 40)"
                                    style={{transition:'stroke-dasharray 0.8s ease'}}/>
                            </svg>
                            <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:'var(--text)'}}>
                                {successRate}%
                            </div>
                        </div>
                        <div style={{fontSize:'12px', color:'var(--text-muted)'}}>Today's delivery</div>
                    </div>

                    {/* 30 day */}
                    <div style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px'}}>
                        <div style={{fontSize:'11px', color:'var(--text-muted)', marginBottom:'8px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.5px'}}>30 Day Total</div>
                        <div style={{fontSize:'24px', fontWeight:'800', color:'var(--primary)'}}>{stats?.last30days?.fired || 0}</div>
                        <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'2px'}}>notifications sent</div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}} className="quick-links">
                {[
                    { to:'/webhooks', icon:<Webhook size={20} color="#6366f1"/>, title:'My Webhooks', sub:`${stats?.webhook_count || 0} active webhooks`, border:'#6366f1' },
                    { to:'/credits',  icon:<CreditCard size={20} color="#f59e0b"/>, title:'Credits', sub:`${Number(stats?.credit_balance||0).toLocaleString()} remaining`, border:'#f59e0b' },
                ].map((item,i) => (
                    <Link key={i} to={item.to} style={{textDecoration:'none'}}>
                        <div style={{
                            background:'var(--bg-card)', border:'1px solid var(--border)',
                            borderRadius:'14px', padding:'18px 20px',
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            transition:'all 0.2s', cursor:'pointer',
                        }}
                        onMouseOver={e=>{e.currentTarget.style.borderColor=item.border; e.currentTarget.style.transform='translateY(-2px)'}}
                        onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                                <div style={{width:'40px', height:'40px', background:item.border+'15', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{fontWeight:'700', fontSize:'14px', color:'var(--text)'}}>{item.title}</div>
                                    <div style={{color:'var(--text-muted)', fontSize:'12px', marginTop:'2px'}}>{item.sub}</div>
                                </div>
                            </div>
                            <ArrowRight size={16} color="var(--text-muted)"/>
                        </div>
                    </Link>
                ))}
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .stat-cards { grid-template-columns: repeat(2,1fr) !important; }
                    .chart-row { grid-template-columns: 1fr !important; }
                    .quick-links { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 400px) {
                    .stat-cards { grid-template-columns: 1fr 1fr !important; }
                }
            `}</style>
        </div>
    );
}
