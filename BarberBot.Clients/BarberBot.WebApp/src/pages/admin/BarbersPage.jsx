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
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Switch,
    IconButton,
    CircularProgress,
    Chip
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../../services/api';

const BarbersPage = () => {
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentBarber, setCurrentBarber] = useState({ name: '', isActive: true });
    const [isEditing, setIsEditing] = useState(false);

    const fetchBarbers = async () => {
        try {
            const response = await api.get('/barbers');
            setBarbers(response.data);
        } catch (error) {
            console.error("Error fetching barbers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBarbers();
    }, []);

    const handleOpenDialog = (barber = null) => {
        if (barber) {
            setCurrentBarber(barber);
            setIsEditing(true);
        } else {
            setCurrentBarber({ name: '', isActive: true });
            setIsEditing(false);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentBarber({ name: '', isActive: true });
    };

    const handleSave = async () => {
        try {
            if (isEditing) {
                await api.put(`/barbers/${currentBarber.id}`, currentBarber);
            } else {
                await api.post('/barbers', currentBarber);
            }
            fetchBarbers();
            handleCloseDialog();
        } catch (error) {
            console.error("Error saving barber:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu berberi silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/barbers/${id}`);
                fetchBarbers();
            } catch (error) {
                console.error("Error deleting barber:", error);
            }
        }
    };

    const handleToggleActive = async (barber) => {
        try {
            const updatedBarber = { ...barber, isActive: !barber.isActive };
            await api.put(`/barbers/${barber.id}`, updatedBarber);
            fetchBarbers();
        } catch (error) {
            console.error("Error toggling barber status:", error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" sx={{ color: 'primary.main' }}>
                    Berber Yönetimi
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Yeni Berber Ekle
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Ad Soyad</TableCell>
                            <TableCell>Durum</TableCell>
                            <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {barbers.map((barber) => (
                            <TableRow key={barber.id} hover>
                                <TableCell>{barber.id}</TableCell>
                                <TableCell>{barber.name}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={barber.isActive ? "Aktif" : "Pasif"}
                                        color={barber.isActive ? "success" : "default"}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Switch
                                        checked={barber.isActive}
                                        onChange={() => handleToggleActive(barber)}
                                        color="primary"
                                    />
                                    <IconButton onClick={() => handleOpenDialog(barber)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(barber.id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>{isEditing ? 'Berberi Düzenle' : 'Yeni Berber Ekle'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Ad Soyad"
                        fullWidth
                        value={currentBarber.name}
                        onChange={(e) => setCurrentBarber({ ...currentBarber, name: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>İptal</Button>
                    <Button onClick={handleSave} variant="contained">Kaydet</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BarbersPage;
