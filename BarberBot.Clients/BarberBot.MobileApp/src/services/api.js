import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 is the special alias to your host loopback interface (i.e., 127.0.0.1 on your development machine)
// for the Android emulator.
// For iOS simulator, you can use 'http://localhost:5117/api'
// For physical device, use your machine's LAN IP, e.g., 'http://192.168.1.x:5117/api'
const API_URL = 'https://nondialyzing-hyperbolic-avianna.ngrok-free.dev7/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
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
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                const token = await AsyncStorage.getItem('token');

                // Use a separate axios instance to avoid infinite loops if this fails
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    token,
                    refreshToken
                });

                await AsyncStorage.setItem('token', response.data.token);
                await AsyncStorage.setItem('refreshToken', response.data.refreshToken);

                api.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.token;
                originalRequest.headers['Authorization'] = 'Bearer ' + response.data.token;

                return api(originalRequest);
            } catch (err) {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('refreshToken');
                // Navigation to login should be handled by the app state (e.g. context or redux)
                // For now, we just reject and let the UI handle the error
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
