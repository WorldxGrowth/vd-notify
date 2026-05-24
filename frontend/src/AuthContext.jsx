import { createContext, useContext, useState, useEffect } from 'react';
import config from './config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem(config.TOKEN_KEY);
        const userData = localStorage.getItem(config.USER_KEY);
        const loginTime = localStorage.getItem('vdnotify_login_time');

        if (token && userData && loginTime) {
            const days = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60 * 24);
            if (days < config.TOKEN_EXPIRY_DAYS) {
                setUser(JSON.parse(userData));
            } else {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = (token, userData) => {
        localStorage.setItem(config.TOKEN_KEY, token);
        localStorage.setItem(config.USER_KEY, JSON.stringify(userData));
        localStorage.setItem('vdnotify_login_time', Date.now().toString());
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem(config.TOKEN_KEY);
        localStorage.removeItem(config.USER_KEY);
        localStorage.removeItem('vdnotify_login_time');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
