import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { LayoutDashboard, Webhook, CreditCard, LogOut, Menu, X, Bell, Sun, Moon, Code } from 'lucide-react';
import config from '../config';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/'); };

    const navItems = [
        { path:'/dashboard', icon:<LayoutDashboard size={18}/>, label:'Dashboard' },
        { path:'/webhooks',  icon:<Webhook size={18}/>,         label:'Webhooks' },
        { path:'/credits',   icon:<CreditCard size={18}/>,      label:'Credits' },
        { path:'/docs',      icon:<Code size={18}/>,             label:'Docs' },
    ];

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path+'/');

    return (
        <div style={{display:'flex', minHeight:'100vh', background:'var(--bg)', overflow:'hidden', width:'100%'}}>

            {/* Sidebar — Desktop only */}
            <aside style={{
                width:'210px', minWidth:'210px', background:'var(--bg-card)',
                borderRight:'1px solid var(--border)',
                display:'flex', flexDirection:'column',
                position:'fixed', top:0, left:0, height:'100vh', zIndex:100,
            }} className="sidebar-desktop">

                {/* Logo */}
                <div style={{padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'9px'}}>
                    <img src="/logo.svg" alt="logo" style={{width:'28px', height:'28px', flexShrink:0}}/>
                    <span style={{fontWeight:'800', fontSize:'16px', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{config.APP_NAME}</span>
                </div>

                {/* Nav */}
                <nav style={{flex:1, padding:'10px 8px', overflowY:'auto'}}>
                    {navItems.map(item => (
                        <Link key={item.path} to={item.path} style={{
                            display:'flex', alignItems:'center', gap:'9px',
                            padding:'9px 11px', borderRadius:'8px', marginBottom:'2px',
                            textDecoration:'none', fontSize:'13px', fontWeight:'500',
                            background: isActive(item.path) ? '#6366f115' : 'transparent',
                            color: isActive(item.path) ? 'var(--primary)' : 'var(--text-muted)',
                            transition:'all 0.15s',
                        }}>
                            {item.icon} {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Bottom */}
                <div style={{padding:'12px', borderTop:'1px solid var(--border)'}}>
                    <button onClick={toggleTheme} style={{
                        display:'flex', alignItems:'center', gap:'7px', width:'100%',
                        padding:'7px 10px', borderRadius:'7px', border:'1px solid var(--border)',
                        background:'var(--bg-card2)', color:'var(--text-muted)', cursor:'pointer',
                        fontSize:'12px', marginBottom:'8px',
                    }}>
                        {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>

                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', padding:'4px 2px'}}>
                        <div style={{width:'28px', height:'28px', background:'var(--primary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', color:'white', flexShrink:0}}>
                            {user?.email?.[0]?.toUpperCase()}
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                            <div style={{fontSize:'11px', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)'}}>{user?.email}</div>
                            <div style={{fontSize:'10px', color:'var(--primary)'}}>{Number(user?.credit_balance||0).toLocaleString()} credits</div>
                        </div>
                    </div>

                    <button onClick={handleLogout} style={{
                        display:'flex', alignItems:'center', gap:'7px', width:'100%',
                        padding:'7px 10px', borderRadius:'7px', border:'none',
                        background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontSize:'12px',
                        transition:'color 0.15s',
                    }}
                    onMouseOver={e=>e.currentTarget.style.color='var(--error)'}
                    onMouseOut={e=>e.currentTarget.style.color='var(--text-muted)'}>
                        <LogOut size={13}/> Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="mobile-header" style={{
                display:'none', position:'fixed', top:0, left:0, right:0, zIndex:200,
                background:'var(--bg-card)', borderBottom:'1px solid var(--border)',
                padding:'0 14px', alignItems:'center', justifyContent:'space-between',
                height:'54px',
            }}>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <img src="/logo.svg" alt="logo" style={{width:'24px', height:'24px'}}/>
                    <span style={{fontWeight:'800', fontSize:'15px', color:'var(--text)'}}>{config.APP_NAME}</span>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                    <button onClick={toggleTheme} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'6px', display:'flex', alignItems:'center'}}>
                        {theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}
                    </button>
                    <button onClick={() => setMobileOpen(!mobileOpen)} style={{background:'none', border:'none', color:'var(--text)', cursor:'pointer', padding:'6px', display:'flex', alignItems:'center'}}>
                        {mobileOpen ? <X size={21}/> : <Menu size={21}/>}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div style={{
                    position:'fixed', top:'54px', left:0, right:0, bottom:0,
                    background:'var(--bg-card)', zIndex:150, padding:'12px',
                    overflowY:'auto',
                }}>
                    {navItems.map(item => (
                        <Link key={item.path} to={item.path}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                display:'flex', alignItems:'center', gap:'12px',
                                padding:'13px 14px', borderRadius:'10px', marginBottom:'4px',
                                textDecoration:'none', fontSize:'15px', fontWeight:'500',
                                background: isActive(item.path) ? '#6366f115' : 'transparent',
                                color: isActive(item.path) ? 'var(--primary)' : 'var(--text)',
                            }}>
                            {item.icon} {item.label}
                        </Link>
                    ))}
                    <div style={{borderTop:'1px solid var(--border)', marginTop:'10px', paddingTop:'10px'}}>
                        <div style={{padding:'6px 14px', fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user?.email}</div>
                        <button onClick={handleLogout} style={{
                            display:'flex', alignItems:'center', gap:'12px', width:'100%',
                            padding:'13px 14px', borderRadius:'10px', border:'none',
                            background:'transparent', color:'var(--error)', cursor:'pointer', fontSize:'15px',
                        }}>
                            <LogOut size={18}/> Logout
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content — KEY FIX: overflow-x hidden + proper width */}
            <main className="main-content" style={{
                marginLeft:'210px',
                flex:1,
                minWidth:0,
                width:'calc(100% - 210px)',
                maxWidth:'calc(100% - 210px)',
                padding:'24px',
                minHeight:'100vh',
                background:'var(--bg)',
                overflowX:'hidden',
                boxSizing:'border-box',
            }}>
                {children}
            </main>

            <style>{`
                * { box-sizing: border-box; }
                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .mobile-header { display: flex !important; }
                    .main-content {
                        margin-left: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 66px 12px 20px !important;
                    }
                }
            `}</style>
        </div>
    );
}
