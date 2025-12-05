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
    Switch,
    Snackbar
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../../services/api';

const AddAppointmentPage = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);

    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // Calculate default date (today) and time (next 30 min slot)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const [formData, setFormData] = useState({
        customerId: '',
        userId: '',
        serviceId: '',
        date: todayStr,
        time: '',
        newCustomerName: '',
        newCustomerPhone: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

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
                setSnackbar({
                    open: true,
                    message: 'Veriler yüklenirken hata oluştu.',
                    severity: 'error'
                });
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchSlots = async () => {
            if (formData.userId && formData.serviceId && formData.date) {
                setSlotsLoading(true);
                try {
                    const res = await api.get('/appointments/available-slots', {
                        params: {
                            barberId: formData.userId,
                            serviceId: formData.serviceId,
                            date: formData.date
                        }
                    });
                    setAvailableSlots(res.data);

                    // Reset time if current time is not in available slots
                    if (formData.time && !res.data.includes(formData.time)) {
                        setFormData(prev => ({ ...prev, time: '' }));
                    }
                } catch (err) {
                    console.error("Error fetching slots:", err);
                    setSnackbar({
                        open: true,
                        message: 'Uygun saatler getirilemedi.',
                        severity: 'error'
                    });
                } finally {
                    setSlotsLoading(false);
                }
            } else {
                setAvailableSlots([]);
            }
        };

        fetchSlots();
    }, [formData.userId, formData.serviceId, formData.date]);

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

            setSnackbar({
                open: true,
                message: 'Randevu başarıyla oluşturuldu!',
                severity: 'success'
            });

            // Wait a bit before navigating so user sees the success message
            setTimeout(() => {
                navigate('/admin/appointments');
            }, 1500);

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

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
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
                            <FormControl fullWidth required disabled={!formData.userId || !formData.serviceId || !formData.date || slotsLoading}>
                                <InputLabel>{slotsLoading ? 'Saatler Yükleniyor...' : 'Saat'}</InputLabel>
                                <Select
                                    name="time"
                                    value={formData.time}
                                    label={slotsLoading ? 'Saatler Yükleniyor...' : 'Saat'}
                                    onChange={handleChange}
                                >
                                    {availableSlots.length > 0 ? (
                                        availableSlots.map((slot) => (
                                            <MenuItem key={slot} value={slot}>
                                                {slot}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled value="">
                                            <em>Uygun saat bulunamadı</em>
                                        </MenuItem>
                                    )}
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AddAppointmentPage;
