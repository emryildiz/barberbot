import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { Add, Edit, Delete, AccessTime, AttachMoney } from '@mui/icons-material';
import api from '../../services/api';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentService, setCurrentService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        durationMinutes: ''
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await api.get('/services');
            setServices(response.data);
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (service = null) => {
        if (service) {
            setCurrentService(service);
            setFormData({
                name: service.name,
                price: service.price,
                durationMinutes: service.durationMinutes
            });
        } else {
            setCurrentService(null);
            setFormData({
                name: '',
                price: '',
                durationMinutes: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentService(null);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                durationMinutes: parseInt(formData.durationMinutes)
            };

            if (currentService) {
                await api.put(`/services/${currentService.id}`, payload);
            } else {
                await api.post('/services', payload);
            }
            fetchServices();
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving service:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/services/${id}`);
                fetchServices();
            } catch (error) {
                console.error("Error deleting service:", error);
            }
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress sx={{ color: 'black' }} />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Hizmetler
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
                >
                    Yeni Hizmet
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Hizmet Adı</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Fiyat</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Süre</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.id} hover>
                                <TableCell>{service.name}</TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <AttachMoney fontSize="small" color="action" />
                                        {service.price} TL
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <AccessTime fontSize="small" color="action" />
                                        {service.durationMinutes} dk
                                    </Box>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Düzenle">
                                        <IconButton onClick={() => handleOpenDialog(service)} color="primary">
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Sil">
                                        <IconButton onClick={() => handleDelete(service.id)} color="error">
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {services.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Hizmet bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {currentService ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            label="Hizmet Adı"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Fiyat (TL)"
                            type="number"
                            fullWidth
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            InputProps={{
                                startAdornment: <AttachMoney fontSize="small" color="action" sx={{ mr: 1 }} />
                            }}
                        />
                        <TextField
                            label="Süre (Dakika)"
                            type="number"
                            fullWidth
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                            InputProps={{
                                startAdornment: <AccessTime fontSize="small" color="action" sx={{ mr: 1 }} />
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} color="inherit">
                        İptal
                    </Button>
                    <Button onClick={handleSave} variant="contained" sx={{ bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}>
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ServicesPage;
