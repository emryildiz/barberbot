import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    CircularProgress,
    Menu,
    MenuItem,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    CalendarToday,
    PendingActions,
    People,
    AttachMoney,
    FilterList,
    Add
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import authService from '../../services/authService';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        todayAppointments: 0,
        pendingApprovals: 0,
        totalCustomers: 0,
        monthlyRevenue: 0
    });
    const [todayAppointmentsList, setTodayAppointmentsList] = useState([]);
    const [filteredTodayList, setFilteredTodayList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending', 'Confirmed'

    const [role, setRole] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        fetchDashboardData();
        fetchRole();
        const interval = setInterval(fetchDashboardData, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchRole = async () => {
        const r = await authService.getRole();
        setRole(r);
    };

    const fetchDashboardData = async () => {
        try {
            const [appointmentsRes, customersRes] = await Promise.all([
                api.get('/appointments'),
                api.get('/customers')
            ]);

            const appointments = appointmentsRes.data;
            const customers = customersRes.data;

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            const todayApps = appointments.filter(app => app.startTime.startsWith(todayStr));
            const pendingApps = appointments.filter(app => app.status === 'Pending');

            const currentMonth = today.getMonth();
            const monthlyApps = appointments.filter(app => new Date(app.startTime).getMonth() === currentMonth && app.status !== 'Cancelled');
            const revenue = monthlyApps.length * 200;

            setStats({
                todayAppointments: todayApps.length,
                pendingApprovals: pendingApps.length,
                totalCustomers: customers.length,
                monthlyRevenue: revenue
            });

            setTodayAppointmentsList(todayApps);
            setFilteredTodayList(todayApps);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleFilterSelect = (status) => {
        setFilterStatus(status);
        handleFilterClose();
    };

    useEffect(() => {
        if (filterStatus === 'All') {
            setFilteredTodayList(todayAppointmentsList);
        } else {
            setFilteredTodayList(todayAppointmentsList.filter(app => app.status === filterStatus));
        }
    }, [filterStatus, todayAppointmentsList]);

    const handleConfirm = async (id) => {
        try {
            // We need to fetch the appointment first to get start/end times as API requires them for update
            // Or we can just find it in our local list
            const appointment = todayAppointmentsList.find(a => a.id === id);
            if (!appointment) return;

            await api.put(`/appointments/${id}`, {
                startTime: appointment.startTime,
                endTime: appointment.endTime,
                status: 'Confirmed'
            });

            // Update local state
            fetchDashboardData();
        } catch (error) {
            console.error("Error confirming appointment:", error);
            alert("Randevu onaylanırken bir hata oluştu.");
        }
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{
            height: '100%',
            width: '100%',
            minWidth: 250,
            borderRadius: 3,
            boxShadow: 'none',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{
                    bgcolor: `${color}15`,
                    borderRadius: '50%',
                    p: 1.5,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 56,
                    minHeight: 56
                }}>
                    {React.cloneElement(icon, { sx: { color: color, fontSize: 28 } })}
                </Box>
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, whiteSpace: 'nowrap' }}>
                        {title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        {value}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress sx={{ color: 'black' }} />
            </Box>
        );
    }

    return (
        <Box>
            <Box mb={4}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                    Gösterge Paneli
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Güncel randevu durumlarını ve işletmenizin genel görünümünü takip edin.
                </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                    <StatCard
                        title="Bugünkü Randevular"
                        value={stats.todayAppointments}
                        icon={<CalendarToday />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                    <StatCard
                        title="Bekleyen Onaylar"
                        value={stats.pendingApprovals}
                        icon={<PendingActions />}
                        color="#2196f3"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                    <StatCard
                        title="Toplam Müşteriler"
                        value={stats.totalCustomers}
                        icon={<People />}
                        color="#9c27b0"
                    />
                </Grid>
                {role === 'Admin' && (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                        <StatCard
                            title="Aylık Gelir"
                            value={`₺${stats.monthlyRevenue.toLocaleString('tr-TR')}`}
                            icon={<AttachMoney />}
                            color="#ff9800"
                        />
                    </Grid>
                )}
            </Grid>

            {/* Main Content - Today's Appointments */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid rgba(0,0,0,0.08)' }}>
                <Box
                    display="flex"
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    mb={3}
                    gap={2}
                >
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Bugünkü Randevular
                    </Typography>
                    <Box sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' }, display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={handleFilterClick}
                            sx={{ borderRadius: 2, color: 'text.primary', borderColor: 'rgba(0,0,0,0.12)' }}
                        >
                            Filtrele {(!isMobile && filterStatus !== 'All') && `(${filterStatus === 'Pending' ? 'Bekleyen' : filterStatus === 'Confirmed' ? 'Onaylı' : 'İptal'})`}
                        </Button>
                        <Menu
                            anchorEl={filterAnchorEl}
                            open={Boolean(filterAnchorEl)}
                            onClose={handleFilterClose}
                        >
                            <MenuItem onClick={() => handleFilterSelect('All')}>Tümü</MenuItem>
                            <MenuItem onClick={() => handleFilterSelect('Pending')}>Bekleyenler</MenuItem>
                            <MenuItem onClick={() => handleFilterSelect('Confirmed')}>Onaylananlar</MenuItem>
                            <MenuItem onClick={() => handleFilterSelect('Cancelled')}>İptal Edilenler</MenuItem>
                        </Menu>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/admin/appointments/new')}
                            sx={{ borderRadius: 2, bgcolor: 'black', '&:hover': { bgcolor: '#333' } }}
                        >
                            Yeni Randevu
                        </Button>
                    </Box>
                </Box>

                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>Müşteri</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>Saat</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>Hizmet</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>Berber</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>Durum</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTodayList.length > 0 ? (
                                filteredTodayList.map((app) => (
                                    <TableRow key={app.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="bold">{app.customer?.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{app.customer?.phoneNumber}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={new Date(app.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                size="small"
                                                sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell>{app.service?.name}</TableCell>
                                        <TableCell>{app.user?.username}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={app.status === 'Pending' ? 'Bekliyor' : app.status === 'Confirmed' ? 'Onaylandı' : 'İptal Edildi'}
                                                color={app.status === 'Pending' ? 'warning' : app.status === 'Confirmed' ? 'success' : 'error'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {app.status === 'Pending' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => handleConfirm(app.id)}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Onayla
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary">
                                            Bugün için kayıtlı randevu bulunmamaktadır.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                        Toplam {filteredTodayList.length} kayıt gösteriliyor
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default DashboardPage;
