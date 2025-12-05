import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../../services/api';

const EditAppointmentPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [barbers, setBarbers] = useState([]);
    const [services, setServices] = useState([]);
    const [customerName, setCustomerName] = useState('');

    const [formData, setFormData] = useState({
        userId: '',
        serviceId: '',
        date: '',
        time: '',
        status: ''
    });

    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [barbersRes, servicesRes, appointmentRes] = await Promise.all([
                    api.get('/barbers'),
                    api.get('/services'),
                    api.get(`/appointments/${id}`) // Assuming there's a get by ID endpoint, if not we might need to filter from list or add endpoint
                ]);

                setBarbers(barbersRes.data);
                setServices(servicesRes.data);

                const appointment = appointmentRes.data;
                const dateObj = new Date(appointment.startTime);
                const dateStr = dateObj.toISOString().split('T')[0];
                const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                setCustomerName(appointment.customer?.name || 'Bilinmeyen Müşteri');
                setFormData({
                    userId: appointment.userId,
                    serviceId: appointment.serviceId,
                    date: dateStr,
                    time: timeStr,
                    status: appointment.status
                });

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
    }, [id]);

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

                    // Include current time in available slots if it's not there (since we are editing)
                    let slots = res.data;
                    if (formData.time && !slots.includes(formData.time)) {
                        slots = [...slots, formData.time].sort();
                    }
                    setAvailableSlots(slots);

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

        if (!loading) {
            fetchSlots();
        }
    }, [formData.userId, formData.serviceId, formData.date, loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const startDateTime = new Date(`${formData.date}T${formData.time}:00+03:00`);
            const service = services.find(s => s.id === parseInt(formData.serviceId));
            const duration = service ? service.durationMinutes : 30;
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            const updateRequest = {
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                status: formData.status
            };

            await api.put(`/appointments/${id}`, updateRequest);

            setSnackbar({
                open: true,
                message: 'Randevu başarıyla güncellendi!',
                severity: 'success'
            });

            setTimeout(() => {
                navigate('/admin/appointments');
            }, 1500);

        } catch (err) {
            let errorMessage = 'Randevu güncellenirken hata oluştu.';
            if (err.response?.data?.message) errorMessage = err.response.data.message;
            else if (err.response?.data?.title) errorMessage = err.response.data.title;
            else if (typeof err.response?.data === 'string') errorMessage = err.response.data;

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
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
                    Randevu Düzenle
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
                        <Typography variant="h6" gutterBottom>Müşteri: {customerName}</Typography>
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
                                    disabled // Barber change might be complex due to availability, let's keep it simple for now or enable if needed
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
                                    disabled // Service change affects duration, which affects slots. Keeping it simple.
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

                    <Box sx={{ mb: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel>Durum</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                label="Durum"
                                onChange={handleChange}
                            >
                                <MenuItem value="Pending">Bekliyor</MenuItem>
                                <MenuItem value="Confirmed">Onaylandı</MenuItem>
                                <MenuItem value="Cancelled">İptal Edildi</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ height: 48 }}
                    >
                        Güncelle
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

export default EditAppointmentPage;
