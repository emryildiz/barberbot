import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../../services/api';

const AddAppointmentPage = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);

    const [isNewCustomer, setIsNewCustomer] = useState(false);

    const [formData, setFormData] = useState({
        customerId: '',
        userId: '',
        serviceId: '',
        date: '',
        time: '',
        newCustomerName: '',
        newCustomerPhone: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersRes, barbersRes, servicesRes] = await Promise.all([
                    api.get('/customers'),
                    api.get('/barbers'),
                    api.get('/services')
                ]);
                setCustomers(customersRes.data);
                setBarbers(barbersRes.data);
                setServices(servicesRes.data);
            } catch (err) {
                setError('Veriler yüklenirken hata oluştu.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Combine date and time, explicitly setting Turkey Time (+03:00)
            const startDateTime = new Date(`${formData.date}T${formData.time}:00+03:00`);

            // Find service duration to calculate end time
            const service = services.find(s => s.id === parseInt(formData.serviceId));
            const duration = service ? service.durationMinutes : 30;
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            const appointmentRequest = {
                userId: parseInt(formData.userId),
                serviceId: parseInt(formData.serviceId),
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString()
            };

            if (isNewCustomer) {
                appointmentRequest.newCustomerName = formData.newCustomerName;
                appointmentRequest.newCustomerPhone = formData.newCustomerPhone;
            } else {
                appointmentRequest.customerId = parseInt(formData.customerId);
            }

            await api.post('/appointments', appointmentRequest);

            navigate('/admin/appointments');
        } catch (err) {
            // Extract the error message from the response
            let errorMessage = 'Randevu oluşturulurken hata oluştu.';

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.title) {
                errorMessage = err.response.data.title;
            } else if (typeof err.response?.data === 'string') {
                errorMessage = err.response.data;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            console.error(err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (loading) return <Typography sx={{ p: 3 }}>Yükleniyor...</Typography>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" color="primary" fontWeight="bold">
                    Yeni Randevu Ekle
                </Typography>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin/appointments')}
                    color="inherit"
                >
                    Geri Dön
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Müşteri Bilgileri</Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isNewCustomer}
                                        onChange={(e) => setIsNewCustomer(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Yeni Müşteri"
                            />
                        </Box>

                        {isNewCustomer ? (
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Ad Soyad"
                                        name="newCustomerName"
                                        value={formData.newCustomerName}
                                        onChange={handleChange}
                                        required={isNewCustomer}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Telefon (5XX...)"
                                        name="newCustomerPhone"
                                        value={formData.newCustomerPhone}
                                        onChange={handleChange}
                                        required={isNewCustomer}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            <FormControl fullWidth>
                                <InputLabel>Müşteri Seçin</InputLabel>
                                <Select
                                    name="customerId"
                                    value={formData.customerId}
                                    label="Müşteri Seçin"
                                    onChange={handleChange}
                                    required={!isNewCustomer}
                                >
                                    {customers.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.name} ({c.phoneNumber})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>Berber</InputLabel>
                                <Select
                                    name="userId"
                                    value={formData.userId}
                                    label="Berber"
                                    onChange={handleChange}
                                    required
                                >
                                    {barbers.map(b => (
                                        <MenuItem key={b.id} value={b.id}>{b.username}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>Hizmet</InputLabel>
                                <Select
                                    name="serviceId"
                                    value={formData.serviceId}
                                    label="Hizmet"
                                    onChange={handleChange}
                                    required
                                >
                                    {services.map(s => (
                                        <MenuItem key={s.id} value={s.id}>{s.name} ({s.price} TL)</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Tarih"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Saat</InputLabel>
                                <Select
                                    name="time"
                                    value={formData.time}
                                    label="Saat"
                                    onChange={handleChange}
                                >
                                    {Array.from({ length: 24 * 2 }).map((_, i) => {
                                        const hour = Math.floor(i / 2);
                                        const minute = i % 2 === 0 ? '00' : '30';
                                        const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
                                        return (
                                            <MenuItem key={timeString} value={timeString}>
                                                {timeString}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ height: 48 }}
                    >
                        Randevu Oluştur
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default AddAppointmentPage;
