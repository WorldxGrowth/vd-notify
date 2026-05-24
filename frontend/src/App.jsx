import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Webhooks from './pages/Webhooks';
import WebhookDetail from './pages/WebhookDetail';
import Credits from './pages/Credits';
import Docs from './pages/Docs';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
            <div style={{textAlign:'center'}}>
                <div style={{width:'40px',height:'40px',border:'3px solid var(--border)',borderTopColor:'var(--primary)',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 12px'}}></div>
                <div style={{color:'var(--text-muted)',fontSize:'14px'}}>Loading...</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
    return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Toaster position="top-right" toastOptions={{
                        style: { background:'var(--bg-card)', color:'var(--text)', border:'1px solid var(--border)', fontFamily:'Inter,sans-serif', fontSize:'14px' }
                    }}/>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/docs" element={<Docs />} />
                        <Route path="/login"   element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="/signup"  element={<PublicRoute><Signup /></PublicRoute>} />
                        <Route path="/auth/callback" element={<Login />} />
                        <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                        <Route path="/webhooks"  element={<PrivateRoute><Layout><Webhooks /></Layout></PrivateRoute>} />
                        <Route path="/webhooks/:id" element={<PrivateRoute><Layout><WebhookDetail /></Layout></PrivateRoute>} />
                        <Route path="/credits"   element={<PrivateRoute><Layout><Credits /></Layout></PrivateRoute>} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}
