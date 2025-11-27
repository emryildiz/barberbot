import api from './api';

const appointmentService = {
    getAll: async () => {
        const response = await api.get('/appointments');
        return response.data;
    },
    create: async (appointment) => {
        const response = await api.post('/appointments', appointment);
        return response.data;
    },
    update: async (id, appointment) => {
        const response = await api.put(`/appointments/${id}`, appointment);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/appointments/${id}`);
        return response.data;
    }
};

export default appointmentService;
