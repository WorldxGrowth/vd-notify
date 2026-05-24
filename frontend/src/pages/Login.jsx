import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import config from '../config';

export default function Login() {
    const [form, setForm] = useState({ email:'', password:'' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Google OAuth callback handler
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const name = params.get('name');
        const email = params.get('email');
        const credits = params.get('credits');
        const error = params.get('error');

        if (error) {
            toast.error('Google login failed. Try again.');
            return;
        }
        if (token && email) {
            login(token, { email, full_name: name, credit_balance: credits || 500 });
            toast.success(`Welcome${name ? ', ' + name.split(' ')[0] : ''}! 👋`);
            navigate('/dashboard');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', form);
            login(res.data.token, res.data.user);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = () => {
        window.location.href = `${config.API_BASE_URL}/api/auth/google`;
    };

    return (
        <div style={{minHeight:'100vh', display:'flex', background:'var(--bg)'}}>

            {/* Left Panel — visible on desktop */}
            <div className="login-left" style={{
                flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
                background:'linear-gradient(135deg, #1a0533 0%, #0d1b6e 50%, #1a3a8f 100%)',
                padding:'60px 48px', position:'relative', overflow:'hidden',
            }}>
                {/* BG grid */}
                <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'50px 50px'}}/>
                {/* Orb */}
                <div style={{position:'absolute', top:'20%', left:'20%', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, #818cf840 0%, transparent 70%)', filter:'blur(40px)'}}/>

                <div style={{position:'relative', zIndex:1, textAlign:'center', maxWidth:'380px'}}>
                    <Link to="/" style={{display:'inline-flex', alignItems:'center', gap:'10px', textDecoration:'none', marginBottom:'40px'}}>
                        <img src="/logo.svg" alt="logo" style={{width:'40px', height:'40px'}}/>
                        <span style={{fontWeight:'800', fontSize:'22px', color:'white'}}>{config.APP_NAME}</span>
                    </Link>

                    <h2 style={{fontSize:'clamp(24px,3vw,36px)', fontWeight:'900', color:'white', marginBottom:'14px', letterSpacing:'-0.5px'}}>
                        Real-Time Webhook<br/>Notifications
                    </h2>
                    <p style={{color:'rgba(255,255,255,0.65)', fontSize:'15px', lineHeight:1.8, marginBottom:'40px'}}>
                        Monitor VDChain wallet activity in real-time. HTTP webhooks or email alerts.
                    </p>

                    {/* Feature list */}
                    {['500 free credits on signup', 'Alchemy-compatible payload format', 'Email & HTTP notifications', 'Real-time address monitoring'].map((f,i) => (
                        <div key={i} style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', textAlign:'left'}}>
                            <div style={{width:'20px', height:'20px', borderRadius:'50%', background:'#10b98130', border:'1px solid #10b98150', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                                <span style={{color:'#10b981', fontSize:'11px', fontWeight:'700'}}>✓</span>
                            </div>
                            <span style={{color:'rgba(255,255,255,0.75)', fontSize:'14px'}}>{f}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel — form */}
            <div style={{
                width:'100%', maxWidth:'480px', display:'flex', flexDirection:'column',
                justifyContent:'center', padding:'40px 32px', position:'relative',
                background:'var(--bg)',
            }} className="login-right">

                {/* Top bar */}
                <div style={{position:'absolute', top:'20px', right:'20px', display:'flex', gap:'8px', alignItems:'center'}}>
                    <button onClick={toggleTheme} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', padding:'7px', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center'}}>
                        <span style={{fontSize:'14px'}}>{theme === 'dark' ? '☀️' : '🌙'}</span>
                    </button>
                </div>

                {/* Mobile logo */}
                <div className="mobile-logo" style={{display:'none', textAlign:'center', marginBottom:'28px'}}>
                    <Link to="/" style={{display:'inline-flex', alignItems:'center', gap:'8px', textDecoration:'none'}}>
                        <img src="/logo.svg" alt="logo" style={{width:'32px', height:'32px'}}/>
                        <span style={{fontWeight:'800', fontSize:'18px', color:'var(--text)'}}>{config.APP_NAME}</span>
                    </Link>
                </div>

                <div style={{maxWidth:'380px', width:'100%', margin:'0 auto'}}>
                    <h1 style={{fontSize:'clamp(22px,3vw,28px)', fontWeight:'800', marginBottom:'6px', color:'var(--text)', letterSpacing:'-0.5px'}}>
                        Sign in
                    </h1>
                    <p style={{color:'var(--text-muted)', fontSize:'14px', marginBottom:'28px'}}>
                        Welcome back to {config.APP_NAME}
                    </p>

                    {/* Google Login */}
                    <button onClick={handleGoogle} style={{
                        width:'100%', padding:'12px', borderRadius:'10px',
                        border:'1px solid var(--border)', background:'var(--bg-card)',
                        color:'var(--text)', cursor:'pointer', fontSize:'14px', fontWeight:'600',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                        marginBottom:'20px', transition:'all 0.2s',
                    }}
                    onMouseOver={e=>{e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.background='var(--bg-card2)'}}
                    onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-card)'}}>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px'}}>
                        <div style={{flex:1, height:'1px', background:'var(--border)'}}/>
                        <span style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'500'}}>or sign in with email</span>
                        <div style={{flex:1, height:'1px', background:'var(--border)'}}/>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div style={{marginBottom:'14px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'600', marginBottom:'6px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Email</label>
                            <input type="email" placeholder="you@example.com" value={form.email}
                                onChange={e => setForm({...form, email:e.target.value})} required
                                style={{fontSize:'14px'}}/>
                        </div>
                        <div style={{marginBottom:'22px'}}>
                            <label style={{display:'block', fontSize:'12px', fontWeight:'600', marginBottom:'6px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Password</label>
                            <div style={{position:'relative'}}>
                                <input type={showPass?'text':'password'} placeholder="••••••••" value={form.password}
                                    onChange={e => setForm({...form, password:e.target.value})} required
                                    style={{paddingRight:'44px', fontSize:'14px'}}/>
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                    position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                                    background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center',
                                }}>
                                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                        </div>
                        <button type="submit" style={{
                            width:'100%', padding:'13px', borderRadius:'10px', border:'none',
                            background:'var(--primary)', color:'white', cursor:'pointer',
                            fontSize:'15px', fontWeight:'700', display:'flex', alignItems:'center',
                            justifyContent:'center', gap:'8px', transition:'all 0.2s',
                        }} disabled={loading}
                        onMouseOver={e=>!loading && (e.currentTarget.style.background='var(--primary-dark)')}
                        onMouseOut={e=>e.currentTarget.style.background='var(--primary)'}>
                            {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16}/></>}
                        </button>
                    </form>

                    <p style={{textAlign:'center', marginTop:'20px', fontSize:'14px', color:'var(--text-muted)'}}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{color:'var(--primary)', textDecoration:'none', fontWeight:'700'}}>
                            Sign up free →
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .login-left { display: none !important; }
                    .login-right { max-width: 100% !important; padding: 32px 20px !important; }
                    .mobile-logo { display: block !important; }
                }
            `}</style>
        </div>
    );
}
