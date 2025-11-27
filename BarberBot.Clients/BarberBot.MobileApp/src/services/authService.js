import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        if (response.data.token) {
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }
        return response.data;
    },
    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
    },
    isAuthenticated: async () => {
        const token = await AsyncStorage.getItem('token');
        return !!token;
    }
};

export default authService;
