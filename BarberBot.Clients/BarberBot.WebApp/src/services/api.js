import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5117/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true // Important for sending cookies
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const token = localStorage.getItem('token');
                // Refresh token is sent automatically via cookie
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    token
                }, { withCredentials: true });

                localStorage.setItem('token', response.data.token);

                api.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.token;
                return api(originalRequest);
            } catch (err) {
                localStorage.removeItem('token');
                window.location.href = '/admin/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
