import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Switch,
    TextField,
    Button,
    Divider,
    FormControlLabel,
    Alert,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import { Save } from '@mui/icons-material';
import api from '../../services/api';

const daysOfWeek = [
    { id: 1, name: 'Pazartesi' },
    { id: 2, name: 'Salı' },
    { id: 3, name: 'Çarşamba' },
    { id: 4, name: 'Perşembe' },
    { id: 5, name: 'Cuma' },
    { id: 6, name: 'Cumartesi' },
    { id: 0, name: 'Pazar' }
];

const SettingsPage = () => {
    const [workingHours, setWorkingHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchWorkingHours();
    }, []);

    const fetchWorkingHours = async () => {
        try {
            const response = await api.get('/workinghours');
            setWorkingHours(response.data);
        } catch (error) {
            console.error('Error fetching working hours:', error);
            showSnackbar('Çalışma saatleri yüklenirken hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (dayOfWeek, field, value) => {
        setWorkingHours(prev => prev.map(wh =>
            wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh
        ));
    };

    const handleSave = async () => {
        try {
            await api.put('/workinghours', workingHours);
            showSnackbar('Ayarlar başarıyla kaydedildi.', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showSnackbar('Ayarlar kaydedilirken hata oluştu.', 'error');
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const getWorkingHour = (dayId) => {
        return workingHours.find(wh => wh.dayOfWeek === dayId) || {
            dayOfWeek: dayId,
            isClosed: false,
            startTime: '09:00',
            endTime: '21:00'
        };
    };

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                    Ayarlar
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    İşletme ayarlarını ve çalışma saatlerini buradan yönetebilirsiniz.
                </Typography>
            </Box>

            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.08)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight="bold">
                        Çalışma Saatleri
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
                    >
                        Kaydet
                    </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Gün</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Durum</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Açılış Saati</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Kapanış Saati</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {daysOfWeek.map((day) => {
                                const wh = getWorkingHour(day.id);
                                return (
                                    <TableRow key={day.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {day.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={!wh.isClosed}
                                                        onChange={(e) => handleChange(day.id, 'isClosed', !e.target.checked)}
                                                        color="success"
                                                    />
                                                }
                                                label={wh.isClosed ? "Kapalı" : "Açık"}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="time"
                                                value={wh.startTime}
                                                onChange={(e) => handleChange(day.id, 'startTime', e.target.value)}
                                                disabled={wh.isClosed}
                                                fullWidth
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ maxWidth: 150 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="time"
                                                value={wh.endTime}
                                                onChange={(e) => handleChange(day.id, 'endTime', e.target.value)}
                                                disabled={wh.isClosed}
                                                fullWidth
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ maxWidth: 150 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SettingsPage;
