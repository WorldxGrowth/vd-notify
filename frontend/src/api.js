import axios from 'axios';
import config from './config';

const api = axios.create({
    baseURL: '',
    timeout: 15000,
});

api.interceptors.request.use((req) => {
    const token = localStorage.getItem(config.TOKEN_KEY);
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem(config.TOKEN_KEY);
            localStorage.removeItem(config.USER_KEY);
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
