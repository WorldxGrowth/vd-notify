import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code, ArrowRight, CheckCircle, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import config from '../config';

export default function Landing() {
    const { theme, toggleTheme } = useTheme();
    const [mobileMenu, setMobileMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const features = [
        { icon:'⚡', title:'Real-Time', desc:'Get notified within seconds of any on-chain activity on VDChain.' },
        { icon:'🔒', title:'Secure', desc:'HMAC-SHA256 signed payloads. Verify every webhook with your signing key.' },
        { icon:'📧', title:'Email Alerts', desc:'No server needed. Get beautiful HTML email alerts directly to your inbox.' },
        { icon:'🔗', title:'Alchemy Compatible', desc:'Same payload format as Alchemy. Migrate existing integrations in minutes.' },
        { icon:'📊', title:'Analytics', desc:'Track delivery rates, success/failure stats, and credit usage in real-time.' },
        { icon:'🌐', title:'REST API', desc:'Full API access to manage webhooks programmatically with your API key.' },
    ];

    return (
        <div style={{minHeight:'100vh', background:'var(--bg)', overflowX:'hidden'}}>

            {/* Navbar */}
            <header style={{
                position:'fixed', top:0, left:0, right:0, zIndex:500,
                background: scrolled ? 'rgba(10,10,15,0.9)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                transition:'all 0.3s',
            }}>
                <div style={{maxWidth:'1140px', margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px'}}>
                    <Link to="/" style={{display:'flex', alignItems:'center', gap:'10px', textDecoration:'none'}}>
                        <img src="/logo.svg" alt="logo" style={{width:'32px', height:'32px'}}/>
                        <span style={{fontWeight:'800', fontSize:'18px', color:'white'}}>{config.APP_NAME}</span>
                    </Link>

                    <nav className="desktop-nav" style={{display:'flex', alignItems:'center', gap:'28px'}}>
                        {[['#features','Features'],['#pricing','Pricing'],['#docs','Docs']].map(([href,label]) => (
                            <a key={href} href={href} style={{color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:'14px', fontWeight:'500', transition:'color 0.2s'}}
                                onMouseOver={e=>e.target.style.color='white'}
                                onMouseOut={e=>e.target.style.color='rgba(255,255,255,0.7)'}>
                                {label}
                            </a>
                        ))}
                    </nav>

                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <button onClick={toggleTheme} style={{background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', padding:'7px', cursor:'pointer', color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center'}}>
                            {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
                        </button>
                        <Link to="/login" className="desktop-nav" style={{color:'rgba(255,255,255,0.8)', textDecoration:'none', fontSize:'14px', fontWeight:'500', padding:'7px 14px'}}>Login</Link>
                        <Link to="/signup" style={{
                            background:'white', color:'#4f46e5', textDecoration:'none',
                            padding:'8px 18px', borderRadius:'8px', fontSize:'14px', fontWeight:'700',
                            transition:'all 0.2s', display:'flex', alignItems:'center', gap:'6px',
                        }}>
                            Get Started <ArrowRight size={14}/>
                        </Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="mobile-menu-btn" style={{display:'none', background:'none', border:'none', color:'white', cursor:'pointer'}}>
                            {mobileMenu ? <X size={22}/> : <Menu size={22}/>}
                        </button>
                    </div>
                </div>

                {mobileMenu && (
                    <div style={{background:'#0f0f1a', borderTop:'1px solid rgba(255,255,255,0.1)', padding:'16px 24px'}}>
                        {[['#features','Features'],['#pricing','Pricing'],['#docs','Docs']].map(([href,label]) => (
                            <a key={href} href={href} onClick={() => setMobileMenu(false)} style={{display:'block', padding:'12px 0', color:'rgba(255,255,255,0.8)', textDecoration:'none', fontSize:'15px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                                {label}
                            </a>
                        ))}
                        <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
                            <Link to="/login" style={{flex:1, textAlign:'center', padding:'11px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', color:'white', textDecoration:'none', fontSize:'14px', fontWeight:'500'}}>Login</Link>
                            <Link to="/signup" style={{flex:1, textAlign:'center', padding:'11px', background:'white', borderRadius:'8px', color:'#4f46e5', textDecoration:'none', fontSize:'14px', fontWeight:'700'}}>Get Started</Link>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO — Always dark gradient, light/dark both */}
            <section style={{
                minHeight:'100vh',
                background:'linear-gradient(135deg, #1a0533 0%, #0d1b6e 35%, #1a3a8f 60%, #0ea5e9 100%)',
                display:'flex', alignItems:'center',
                padding:'100px 24px 80px',
                position:'relative', overflow:'hidden',
            }}>
                {/* Animated orbs */}
                <div style={{position:'absolute', top:'10%', left:'15%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, #818cf840 0%, transparent 70%)', filter:'blur(40px)', animation:'float 6s ease-in-out infinite'}}/>
                <div style={{position:'absolute', bottom:'10%', right:'10%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, #0ea5e930 0%, transparent 70%)', filter:'blur(40px)', animation:'float 8s ease-in-out infinite reverse'}}/>
                <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, #6366f115 0%, transparent 60%)', filter:'blur(60px)'}}/>

                {/* Grid */}
                <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize:'60px 60px'}}/>

                <div style={{maxWidth:'1140px', margin:'0 auto', width:'100%', display:'grid', gap:'60px', alignItems:'center', position:'relative', zIndex:1}} className="hero-grid">
                    <div>
                        <div style={{display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', padding:'6px 14px', borderRadius:'20px', fontSize:'13px', color:'rgba(255,255,255,0.9)', marginBottom:'28px', fontWeight:'500', backdropFilter:'blur(10px)'}}>
                            <span style={{width:'7px', height:'7px', borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 8px #10b981'}}></span>
                            Live on VDChain Mainnet
                        </div>
                        <h1 style={{fontSize:'clamp(38px,5.5vw,68px)', fontWeight:'900', lineHeight:1.03, marginBottom:'22px', color:'white', letterSpacing:'-2px'}}>
                            Real-Time<br/>
                            <span style={{background:'linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
                                Webhook Alerts
                            </span><br/>
                            for VDChain
                        </h1>
                        <p style={{fontSize:'clamp(15px,1.8vw,19px)', color:'rgba(255,255,255,0.7)', lineHeight:1.8, marginBottom:'40px', maxWidth:'500px'}}>
                            Get instant notifications when any address transacts on VDChain. HTTP webhooks or email alerts — your choice.
                        </p>
                        <div style={{display:'flex', gap:'14px', flexWrap:'wrap'}}>
                            <Link to="/signup" style={{
                                display:'inline-flex', alignItems:'center', gap:'8px',
                                background:'white', color:'#4f46e5', textDecoration:'none',
                                padding:'15px 30px', borderRadius:'10px', fontSize:'16px', fontWeight:'800',
                                boxShadow:'0 8px 32px rgba(0,0,0,0.3)', transition:'all 0.2s',
                            }}>
                                Start Free <ArrowRight size={18}/>
                            </Link>
                            <a href="/docs" style={{
                                display:'inline-flex', alignItems:'center', gap:'8px',
                                border:'1px solid rgba(255,255,255,0.25)', color:'white', textDecoration:'none',
                                padding:'15px 24px', borderRadius:'10px', fontSize:'15px', fontWeight:'500',
                                background:'rgba(255,255,255,0.08)', backdropFilter:'blur(10px)',
                            }}>
                                <Code size={16}/> View Docs
                            </a>
                        </div>
                        <div style={{display:'flex', gap:'24px', marginTop:'36px', flexWrap:'wrap'}}>
                            {['500 free credits', 'No credit card', 'Instant setup'].map(t => (
                                <div key={t} style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'rgba(255,255,255,0.6)'}}>
                                    <CheckCircle size={14} color="#10b981"/> {t}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div style={{position:'relative', display:'flex', justifyContent:'center', alignItems:'center'}} className="hero-visual">
                        <div style={{
                            width:'280px', background:'rgba(255,255,255,0.08)',
                            border:'1px solid rgba(255,255,255,0.15)',
                            borderRadius:'20px', padding:'20px', gap:'10px',
                            backdropFilter:'blur(20px)',
                            boxShadow:'0 25px 80px rgba(0,0,0,0.4)',
                            animation:'float 5s ease-in-out infinite',
                        }}>
                            <div style={{fontSize:'10px', color:'rgba(255,255,255,0.5)', fontWeight:'700', letterSpacing:'1px', marginBottom:'10px'}}>LIVE NOTIFICATION</div>
                            <div style={{background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'10px', padding:'12px', marginBottom:'10px'}}>
                                <div style={{fontSize:'10px', color:'#10b981', fontWeight:'700', marginBottom:'6px'}}>✅ ADDRESS_ACTIVITY</div>
                                <div style={{fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'2px'}}>From: 0xB614...143B</div>
                                <div style={{fontSize:'11px', color:'rgba(255,255,255,0.6)', marginBottom:'6px'}}>To: 0x35bb...FFCC</div>
                                <div style={{fontSize:'18px', color:'white', fontWeight:'800'}}>10.5 VDC</div>
                            </div>
                            <div style={{display:'flex', gap:'8px'}}>
                                <div style={{flex:1, background:'rgba(99,102,241,0.3)', border:'1px solid rgba(99,102,241,0.4)', borderRadius:'8px', padding:'8px', textAlign:'center'}}>
                                    <div style={{fontSize:'11px', fontWeight:'700', color:'#a5b4fc'}}>HTTP ✓</div>
                                </div>
                                <div style={{flex:1, background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'8px', padding:'8px', textAlign:'center'}}>
                                    <div style={{fontSize:'11px', fontWeight:'700', color:'#34d399'}}>Email ✓</div>
                                </div>
                            </div>
                        </div>

                        {[
                            { label:'⚡ Speed', top:'5%', right:'-5%' },
                            { label:'🔒 Secure', bottom:'15%', left:'-5%' },
                            { label:'📧 Email', top:'65%', right:'0%' },
                        ].map((b,i) => (
                            <div key={i} style={{
                                position:'absolute', top:b.top, bottom:b.bottom, left:b.left, right:b.right,
                                background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
                                padding:'8px 16px', borderRadius:'10px', fontSize:'12px', fontWeight:'700',
                                color:'white', backdropFilter:'blur(10px)',
                                boxShadow:'0 4px 20px rgba(0,0,0,0.2)',
                                animation:`float ${3.5+i*0.7}s ease-in-out infinite`,
                            }}>
                                {b.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{padding:'44px 24px', borderBottom:'1px solid var(--border)', background:'var(--bg-card)'}}>
                <div style={{maxWidth:'900px', margin:'0 auto', display:'grid', gap:'20px', textAlign:'center'}} className="stats-grid">
                    {[
                        { value:'~3s', label:'Block Time' },
                        { value:'99.9%', label:'Uptime' },
                        { value:'< 1s', label:'Notification Delay' },
                        { value:'882022', label:'Chain ID' },
                    ].map((s,i) => (
                        <div key={i}>
                            <div style={{fontSize:'clamp(26px,4vw,38px)', fontWeight:'900', color:'var(--primary)'}}>{s.value}</div>
                            <div style={{fontSize:'13px', color:'var(--text-muted)', marginTop:'4px'}}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section id="features" style={{padding:'80px 24px', maxWidth:'1140px', margin:'0 auto'}}>
                <div style={{textAlign:'center', marginBottom:'52px'}}>
                    <div style={{fontSize:'12px', color:'var(--primary)', fontWeight:'700', letterSpacing:'2px', marginBottom:'12px', textTransform:'uppercase'}}>Features</div>
                    <h2 style={{fontSize:'clamp(28px,4vw,42px)', fontWeight:'800', marginBottom:'14px', color:'var(--text)', letterSpacing:'-0.5px'}}>Everything you need</h2>
                    <p style={{color:'var(--text-muted)', fontSize:'16px', maxWidth:'500px', margin:'0 auto', lineHeight:1.7}}>Built for developers who need reliable, real-time blockchain notifications.</p>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'20px'}}>
                    {features.map((f,i) => (
                        <div key={i} className="card" style={{cursor:'default', transition:'all 0.2s'}}
                            onMouseOver={e=>{e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.transform='translateY(-3px)'}}
                            onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'}}>
                            <div style={{fontSize:'30px', marginBottom:'14px'}}>{f.icon}</div>
                            <h3 style={{fontSize:'16px', fontWeight:'700', marginBottom:'8px', color:'var(--text)'}}>{f.title}</h3>
                            <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.7}}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section style={{padding:'80px 24px', background:'var(--bg-card)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)'}}>
                <div style={{maxWidth:'900px', margin:'0 auto', textAlign:'center'}}>
                    <div style={{fontSize:'12px', color:'var(--primary)', fontWeight:'700', letterSpacing:'2px', marginBottom:'12px', textTransform:'uppercase'}}>How It Works</div>
                    <h2 style={{fontSize:'clamp(26px,4vw,38px)', fontWeight:'800', marginBottom:'48px', color:'var(--text)', letterSpacing:'-0.5px'}}>Up and running in 3 steps</h2>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'32px'}}>
                        {[
                            { step:'01', title:'Create Webhook', desc:'Choose HTTP or Email notification type and give it a name.' },
                            { step:'02', title:'Add Addresses', desc:'Register wallet addresses you want to monitor for activity.' },
                            { step:'03', title:'Receive Alerts', desc:'Get instant notifications every time a tracked address transacts.' },
                        ].map((s,i) => (
                            <div key={i}>
                                <div style={{width:'52px', height:'52px', background:'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'18px', fontWeight:'800', color:'white', boxShadow:'0 4px 20px #6366f140'}}>
                                    {s.step}
                                </div>
                                <h3 style={{fontWeight:'700', fontSize:'16px', marginBottom:'8px', color:'var(--text)'}}>{s.title}</h3>
                                <p style={{fontSize:'14px', color:'var(--text-muted)', lineHeight:1.7}}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" style={{padding:'80px 24px', maxWidth:'1000px', margin:'0 auto'}}>
                <div style={{textAlign:'center', marginBottom:'52px'}}>
                    <div style={{fontSize:'12px', color:'var(--primary)', fontWeight:'700', letterSpacing:'2px', marginBottom:'12px', textTransform:'uppercase'}}>Pricing</div>
                    <h2 style={{fontSize:'clamp(26px,4vw,38px)', fontWeight:'800', marginBottom:'12px', color:'var(--text)', letterSpacing:'-0.5px'}}>Simple, transparent pricing</h2>
                    <p style={{color:'var(--text-muted)', fontSize:'15px'}}>Start free. Scale as you grow.</p>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'16px'}}>
                    {[
                        { name:'Free', price:'₹0', sub:'Forever free', credits:'500', webhooks:'3', addresses:'100', highlight:false },
                        { name:'Basic', price:'₹99', sub:'per month', credits:'2,000', webhooks:'10', addresses:'1,000', highlight:false },
                        { name:'Pro', price:'₹299', sub:'per month', credits:'10,000', webhooks:'50', addresses:'10,000', highlight:true },
                        { name:'Pay As You Go', price:'Custom', sub:'per credit', credits:'Unlimited', webhooks:'100', addresses:'50,000', highlight:false },
                    ].map((p,i) => (
                        <div key={i} className="card" style={{position:'relative', borderColor:p.highlight?'var(--primary)':'var(--border)', transition:'transform 0.2s, border-color 0.2s'}}
                            onMouseOver={e=>{e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='var(--primary)'}}
                            onMouseOut={e=>{e.currentTarget.style.transform='none'; if(!p.highlight) e.currentTarget.style.borderColor='var(--border)'}}>
                            {p.highlight && <div style={{position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:'linear-gradient(90deg,#6366f1,#818cf8)', color:'white', padding:'3px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', whiteSpace:'nowrap'}}>MOST POPULAR</div>}
                            <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px', color:'var(--text)'}}>{p.name}</div>
                            <div style={{fontSize:'28px', fontWeight:'900', color:'var(--primary)', marginBottom:'2px'}}>{p.price}</div>
                            <div style={{fontSize:'12px', color:'var(--text-muted)', marginBottom:'20px'}}>{p.sub}</div>
                            {[['Credits/mo',p.credits],['Webhooks',p.webhooks],['Addresses',p.addresses]].map(([k,v]) => (
                                <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:'13px'}}>
                                    <span style={{color:'var(--text-muted)'}}>{k}</span>
                                    <span style={{fontWeight:'600', color:'var(--text)'}}>{v}</span>
                                </div>
                            ))}
                            <Link to="/signup" style={{display:'block', textAlign:'center', marginTop:'20px', padding:'10px', borderRadius:'8px', textDecoration:'none', fontSize:'14px', fontWeight:'600',
                                background:p.highlight?'var(--primary)':'transparent', color:p.highlight?'white':'var(--primary)',
                                border:p.highlight?'none':'1px solid var(--primary)'}}>
                                Get Started
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* Docs */}
            <section id="docs" style={{padding:'80px 24px', background:'var(--bg-card)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)'}}>
                <div style={{maxWidth:'800px', margin:'0 auto'}}>
                    <div style={{textAlign:'center', marginBottom:'40px'}}>
                        <div style={{fontSize:'12px', color:'var(--primary)', fontWeight:'700', letterSpacing:'2px', marginBottom:'12px', textTransform:'uppercase'}}>Developer Docs</div>
                        <h2 style={{fontSize:'clamp(24px,4vw,36px)', fontWeight:'800', marginBottom:'12px', color:'var(--text)', letterSpacing:'-0.5px'}}>Alchemy-Compatible Payload</h2>
                        <p style={{color:'var(--text-muted)', fontSize:'15px'}}>Migrate from Alchemy in minutes. Same format, just for VDChain.</p>
                    </div>
                    <div style={{background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:'14px', overflow:'hidden'}}>
                        <div style={{padding:'12px 20px', borderBottom:'1px solid #1e1e2e', display:'flex', alignItems:'center', gap:'8px'}}>
                            {['#ef4444','#f59e0b','#10b981'].map(c=><div key={c} style={{width:'10px',height:'10px',borderRadius:'50%',background:c}}/>)}
                            <span style={{marginLeft:'8px', fontSize:'12px', color:'#64748b'}}>webhook-payload.json</span>
                        </div>
                        <pre style={{padding:'24px', fontSize:'13px', color:'#a5b4fc', lineHeight:2, margin:0, overflow:'auto'}}>{`{
  "webhookId": "wh_abc123",
  "id": "whevt_xyz789",
  "createdAt": "2026-05-24T00:00:00.000Z",
  "type": "ADDRESS_ACTIVITY",
  "event": {
    "network": "VDCHAIN_MAINNET",
    "activity": [{
      "blockNum": "0x1234ab",
      "hash": "0xabc...def",
      "fromAddress": "0x123...456",
      "toAddress": "0x789...abc",
      "value": 10.5,
      "asset": "VDC",
      "category": "external"
    }]
  }
}`}</pre>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{
                padding:'100px 24px', textAlign:'center',
                background:'linear-gradient(135deg, #1a0533 0%, #0d1b6e 50%, #0ea5e9 100%)',
                position:'relative', overflow:'hidden',
            }}>
                <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize:'60px 60px'}}/>
                <div style={{maxWidth:'600px', margin:'0 auto', position:'relative', zIndex:1}}>
                    <h2 style={{fontSize:'clamp(28px,5vw,48px)', fontWeight:'900', marginBottom:'16px', color:'white', letterSpacing:'-1px'}}>
                        Start building today
                    </h2>
                    <p style={{color:'rgba(255,255,255,0.7)', fontSize:'17px', marginBottom:'40px', lineHeight:1.7}}>
                        Join developers building on VDChain. Free forever — no credit card required.
                    </p>
                    <Link to="/signup" style={{
                        display:'inline-flex', alignItems:'center', gap:'10px',
                        background:'white', color:'#4f46e5', textDecoration:'none',
                        padding:'16px 36px', borderRadius:'12px', fontSize:'17px', fontWeight:'800',
                        boxShadow:'0 8px 40px rgba(0,0,0,0.3)',
                    }}>
                        Create Free Account <ArrowRight size={20}/>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{borderTop:'1px solid var(--border)', background:'var(--bg-card)', padding:'52px 24px 32px'}}>
                <div style={{maxWidth:'1140px', margin:'0 auto'}}>
                    <div style={{display:'grid', gap:'40px', marginBottom:'40px'}} className="footer-grid">
                        <div>
                            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
                                <img src="/logo.svg" alt="logo" style={{width:'30px', height:'30px'}}/>
                                <span style={{fontWeight:'800', fontSize:'17px', color:'var(--text)'}}>{config.APP_NAME}</span>
                            </div>
                            <p style={{fontSize:'13px', color:'var(--text-muted)', lineHeight:1.8, maxWidth:'240px'}}>
                                Real-time webhook notifications for VDChain. Built by UD Pixel Digital Service.
                            </p>
                        </div>
                        {[
                            { title:'Product', links:[['Dashboard','/dashboard'],['Webhooks','/webhooks'],['Credits','/credits']] },
                            { title:'Developers', links:[['Docs','#docs'],['API Reference','#docs'],['VDScan','https://vdscan.io']] },
                            { title:'Company', links:[['About','#'],['VDSwap','#'],['Contact','#']] },
                        ].map((col,i) => (
                            <div key={i}>
                                <div style={{fontWeight:'700', fontSize:'12px', marginBottom:'14px', color:'var(--text)', textTransform:'uppercase', letterSpacing:'1px'}}>{col.title}</div>
                                {col.links.map(([label,href]) => (
                                    <a key={label} href={href} style={{display:'block', color:'var(--text-muted)', textDecoration:'none', fontSize:'13px', marginBottom:'10px', transition:'color 0.2s'}}
                                        onMouseOver={e=>e.target.style.color='var(--primary)'}
                                        onMouseOut={e=>e.target.style.color='var(--text-muted)'}>
                                        {label}
                                    </a>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div style={{borderTop:'1px solid var(--border)', paddingTop:'24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px'}}>
                        <p style={{fontSize:'13px', color:'var(--text-muted)'}}>© 2026 UD Pixel Digital Service. All rights reserved.</p>
                        <p style={{fontSize:'13px', color:'var(--text-muted)'}}>VDChain • Chain ID {config.CHAIN_ID} • {config.CURRENCY}</p>
                    </div>
                </div>
            </footer>

            <style>{`
                .hero-grid { grid-template-columns: 1fr 1fr; }
                .stats-grid { grid-template-columns: repeat(4,1fr); }
                .footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
                .desktop-nav { display: flex !important; }
                .mobile-menu-btn { display: none !important; }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
                @media (max-width: 768px) {
                    .hero-grid { grid-template-columns: 1fr !important; }
                    .hero-visual { display: none !important; }
                    .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .footer-grid { grid-template-columns: 1fr 1fr !important; }
                    .desktop-nav { display: none !important; }
                    .mobile-menu-btn { display: flex !important; }
                }
            `}</style>
        </div>
    );
}
