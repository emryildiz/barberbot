import api from './api';


const authService = {
    login: async (username, password, rememberMe) => {
        const response = await api.post('/auth/login', { username, password, rememberMe });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            // Role is no longer stored in localStorage
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
    },
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
    getRole: async () => {
        // Option 1: Decode token if role is in claims (it is not currently in standard claims in my generator, but let's check)
        // Option 2: Fetch from /auth/me
        try {
            const response = await api.get('/auth/me');
            return response.data.role;
        } catch (error) {
            console.error("Failed to fetch role", error);
            return null;
        }
    },
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            return null;
        }
    }
};

export default authService;
