import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Tooltip,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    CardActions,
    Grid,
    TextField
} from '@mui/material';
import { Add, Edit, Delete, FilterList, Sort, AccessTime, Person, ContentCut, CheckCircle } from '@mui/icons-material';
import api from '../../services/api';

const AppointmentsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [barbers, setBarbers] = useState([]);

    // Filters & Sorting
    const [selectedBarber, setSelectedBarber] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

    // Get search query from URL
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [appointments, selectedBarber, selectedDate, sortOrder, searchQuery]);

    // ... loadData ...

    const applyFiltersAndSort = () => {
        let result = [...appointments];

        // Filter by Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(app =>
                app.customer?.name?.toLowerCase().includes(lowerQuery) ||
                app.customer?.phoneNumber?.includes(lowerQuery) ||
                app.service?.name?.toLowerCase().includes(lowerQuery) ||
                app.user?.username?.toLowerCase().includes(lowerQuery)
            );
        }

        // Filter by Barber
        if (selectedBarber) {
            result = result.filter(app => app.userId === selectedBarber);
        }

        // Filter by Date
        if (selectedDate) {
            result = result.filter(app => app.startTime.startsWith(selectedDate));
        }

        // Sort by Date
        result.sort((a, b) => {
            const dateA = new Date(a.startTime);
            const dateB = new Date(b.startTime);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredAppointments(result);
    };

    const loadData = async () => {
        try {
            const [appointmentsRes, barbersRes] = await Promise.all([
                api.get('/appointments'),
                api.get('/barbers')
            ]);
            setAppointments(appointmentsRes.data);
            setBarbers(barbersRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };



    const handleDelete = async (id) => {
        if (window.confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/appointments/${id}`);
                setAppointments(appointments.filter(app => app.id !== id));
            } catch (error) {
                console.error('Error deleting appointment:', error);
            }
        }
    };

    const handleApprove = async (appointment) => {
        try {
            await api.put(`/appointments/${appointment.id}`, {
                ...appointment,
                status: 'Confirmed'
            });
            loadData(); // Reload to update status
        } catch (error) {
            console.error('Error approving appointment:', error);
        }
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const isPast = (dateString) => {
        return new Date(dateString) < new Date();
    };


    const renderMobileView = () => (
        <Grid container spacing={2}>
            {filteredAppointments.map((app) => {
                const past = isPast(app.startTime);
                return (
                    <Grid size={{ xs: 12 }} key={app.id}>
                        <Card sx={{
                            opacity: past ? 0.7 : 1,
                            border: '1px solid rgba(0, 0, 0, 0.12)',
                            bgcolor: past ? 'rgba(0, 0, 0, 0.04)' : 'background.paper'
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" component="div" color="primary">
                                            {app.customer?.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {app.customer?.phoneNumber}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={new Date(app.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        color={past ? "default" : "primary"}
                                        variant={past ? "filled" : "outlined"}
                                        size="small"
                                        sx={{ bgcolor: past ? undefined : '#e3f2fd', color: past ? undefined : '#1976d2', fontWeight: 'bold' }}
                                    />
                                </Box>

                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ContentCut fontSize="small" color="action" />
                                        <Typography variant="body2">{app.service?.name}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Person fontSize="small" color="action" />
                                        <Typography variant="body2">{app.user?.username}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccessTime fontSize="small" color="action" />
                                        <Typography variant="body2" color={past ? 'text.secondary' : 'text.primary'}>
                                            {new Date(app.startTime).toLocaleDateString('tr-TR')}
                                        </Typography>
                                    </Box>
                                    {app.status === 'Pending' && (
                                        <Chip label="Onay Bekliyor" color="warning" size="small" sx={{ alignSelf: 'flex-start' }} />
                                    )}
                                </Stack>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                                {app.status === 'Pending' && (
                                    <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => handleApprove(app)}>
                                        Onayla
                                    </Button>
                                )}
                                <Button size="small" startIcon={<Edit />} disabled={past}>
                                    Düzenle
                                </Button>
                                <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(app.id)}>
                                    Sil
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                );
            })}
            {filteredAppointments.length === 0 && (
                <Grid size={{ xs: 12 }}>
                    <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                        {appointments.length === 0 ? 'Henüz randevu bulunmamaktadır.' : 'Filtrelere uygun randevu bulunamadı.'}
                    </Typography>
                </Grid>
            )}
        </Grid>
    );

    const renderDesktopView = () => (
        <TableContainer component={Paper} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Table sx={{ minWidth: 650 }} aria-label="appointments table">
                <TableHead>
                    <TableRow>
                        <TableCell>Müşteri</TableCell>
                        <TableCell>Hizmet</TableCell>
                        <TableCell>Berber</TableCell>
                        <TableCell>Tarih</TableCell>
                        <TableCell>Saat</TableCell>
                        <TableCell align="right">İşlemler</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredAppointments.map((app) => {
                        const past = isPast(app.startTime);
                        return (
                            <TableRow
                                key={app.id}
                                sx={{
                                    '&:last-child td, &:last-child th': { border: 0 },
                                    backgroundColor: past ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                                    opacity: past ? 0.6 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <TableCell component="th" scope="row">
                                    <Typography variant="subtitle2">{app.customer?.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{app.customer?.phoneNumber}</Typography>
                                    {app.status === 'Pending' && (
                                        <Chip label="Onay Bekliyor" color="warning" size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                    )}
                                </TableCell>
                                <TableCell>{app.service?.name}</TableCell>
                                <TableCell>{app.user?.username}</TableCell>
                                <TableCell>
                                    <Typography color={past ? 'text.secondary' : 'text.primary'}>
                                        {new Date(app.startTime).toLocaleDateString('tr-TR')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={new Date(app.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        color={past ? "default" : "primary"}
                                        variant={past ? "filled" : "outlined"}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {app.status === 'Pending' && (
                                        <Tooltip title="Onayla">
                                            <IconButton color="success" onClick={() => handleApprove(app)}>
                                                <CheckCircle />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Düzenle">
                                        <IconButton color="primary" aria-label="edit" disabled={past}>
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Sil">
                                        <IconButton color="error" aria-label="delete" onClick={() => handleDelete(app.id)}>
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {filteredAppointments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                <Typography color="text.secondary">
                                    {appointments.length === 0 ? 'Henüz randevu bulunmamaktadır.' : 'Filtrelere uygun randevu bulunamadı.'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" color="primary" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                    Randevular
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/admin/appointments/new')}
                    size={isMobile ? "small" : "medium"}
                >
                    {isMobile ? 'Yeni' : 'Yeni Randevu'}
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3, border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems={isMobile ? "stretch" : "center"}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <FilterList color="action" />
                        <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: 200 }}>
                            <InputLabel>Berber Filtrele</InputLabel>
                            <Select
                                value={selectedBarber}
                                label="Berber Filtrele"
                                onChange={(e) => setSelectedBarber(e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>Tümü</em>
                                </MenuItem>
                                {barbers.map(barber => (
                                    <MenuItem key={barber.id} value={barber.id}>
                                        {barber.username}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            type="date"
                            size="small"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            sx={{ minWidth: 200 }}
                            fullWidth={isMobile}
                        />
                    </Box>

                    {!isMobile && <Box sx={{ flexGrow: 1 }} />}

                    <Button
                        startIcon={<Sort />}
                        onClick={toggleSortOrder}
                        color="inherit"
                        fullWidth={isMobile}
                    >
                        Tarih: {sortOrder === 'asc' ? 'Eskiden Yeniye' : 'Yeniden Eskiye'}
                    </Button>
                </Stack>
            </Paper>

            {isMobile ? renderMobileView() : renderDesktopView()}
        </Box>
    );
};

export default AppointmentsPage;
