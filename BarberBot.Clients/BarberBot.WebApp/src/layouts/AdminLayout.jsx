import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    InputBase,
    Badge
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    CalendarMonth as CalendarIcon,
    EventNote as EventIcon,
    People as PeopleIcon,
    ContentCut as BarberIcon,
    Category as ServiceIcon,
    BarChart as ReportIcon,
    SmartToy as AIIcon,
    Settings as SettingsIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Logout,
    CheckCircle,
    Person as PersonIcon
} from '@mui/icons-material';
import authService from '../services/authService';
import api from '../services/api';

const drawerWidth = 260;

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

    const fetchPendingAppointments = async () => {
        try {
            const response = await api.get('/appointments');
            const pending = response.data.filter(app => app.status === 'Pending');
            setPendingAppointments(pending);
        } catch (error) {
            console.error('Error fetching pending appointments:', error);
        }
    };

    useEffect(() => {
        fetchPendingAppointments();
        // Poll every minute
        const interval = setInterval(fetchPendingAppointments, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleNotificationClick = (event) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleApprove = async (appointment) => {
        try {
            await api.put(`/appointments/${appointment.id}`, {
                ...appointment,
                status: 'Confirmed'
            });
            // Remove from local state immediately
            setPendingAppointments(prev => prev.filter(app => app.id !== appointment.id));
            // Refresh data
            fetchPendingAppointments();
        } catch (error) {
            console.error('Error approving appointment:', error);
        }
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/admin/login');
    };

    const [role, setRole] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setRole(currentUser.role);
            }
        };
        fetchUserData();
    }, []);

    const menuItems = [
        { text: 'Gösterge Paneli', icon: <DashboardIcon />, path: '/admin/dashboard', roles: ['Admin', 'Owner', 'Barber'] },
        { text: 'Randevular', icon: <CalendarIcon />, path: '/admin/appointments', roles: ['Admin', 'Owner', 'Barber'] },
        { text: 'Müşteriler', icon: <PeopleIcon />, path: '/admin/customers', roles: ['Admin', 'Owner', 'Barber'] },
        // { text: 'Berberler', icon: <BarberIcon />, path: '/admin/barbers', roles: ['Admin'] }, // Removed as per request
        { text: 'Hizmetler', icon: <ServiceIcon />, path: '/admin/services', roles: ['Admin', 'Owner'] },
        { text: 'Raporlar', icon: <ReportIcon />, path: '/admin/statistics', roles: ['Admin', 'Owner'] },
        { text: 'Kullanıcılar', icon: <PeopleIcon />, path: '/admin/users', roles: ['Admin', 'Owner'] },
        { text: 'Ayarlar', icon: <SettingsIcon />, path: '/admin/settings', roles: ['Admin', 'Owner'] },
    ];

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(role));

    const drawer = (
        <Box sx={{ bgcolor: '#000000', height: '100%', color: 'white', display: 'flex', flexDirection: 'column' }}>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', px: 3, pt: 2, pb: 2 }}>
                <Box sx={{ bgcolor: 'white', borderRadius: 1, p: 0.5, mr: 2, display: 'flex' }}>
                    <BarberIcon sx={{ color: '#000000' }} />
                </Box>
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                    Berber Pro
                </Typography>
            </Toolbar>

            <List sx={{ px: 2, flexGrow: 1 }}>
                {filteredMenuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ p: 2, mt: 'auto' }}>
                <Box sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                }} onClick={handleMenu}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mr: 2 }}>
                        {user?.username?.charAt(0).toUpperCase() || 'A'}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'white' }}>
                            {user?.username || 'Kullanıcı'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, color: 'rgba(255, 255, 255, 0.7)' }}>
                            {user?.role || 'Rol'}
                        </Typography>
                    </Box>
                </Box>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    <MenuItem onClick={() => {
                        handleClose();
                        navigate('/admin/profile');
                    }}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                        Profil
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                        Çıkış Yap
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'background.default',
                    color: 'text.primary',
                    boxShadow: 'none',
                    borderBottom: '1px solid #e0e0e0'
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Search Bar */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: 5,
                        px: 2,
                        py: 0.5,
                        width: 400,
                        border: '1px solid #e0e0e0'
                    }}>
                        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        <InputBase
                            placeholder="Müşteri ara, randevu bul..."
                            fullWidth
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    navigate(`/admin/appointments?search=${e.target.value}`);
                                }
                            }}
                        />
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton size="large" color="inherit" onClick={handleNotificationClick}>
                        <Badge badgeContent={pendingAppointments.length} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    <Menu
                        anchorEl={notificationAnchorEl}
                        open={Boolean(notificationAnchorEl)}
                        onClose={handleNotificationClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: { width: 320, maxHeight: 400 }
                        }}
                    >
                        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Bekleyen Randevular ({pendingAppointments.length})
                            </Typography>
                        </Box>
                        {pendingAppointments.length === 0 ? (
                            <MenuItem disabled>
                                <ListItemText primary="Bekleyen randevu yok" />
                            </MenuItem>
                        ) : (
                            pendingAppointments.map((app) => (
                                <MenuItem key={app.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, py: 2, borderBottom: '1px solid #f5f5f5' }}>
                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {app.customer?.name || 'Misafir'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {app.service?.name} - {app.barber?.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(app.startTime).toLocaleDateString('tr-TR')} {new Date(app.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            color="success"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleApprove(app);
                                            }}
                                            sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.2)' } }}
                                        >
                                            <CheckCircle fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </MenuItem>
                            ))
                        )}
                    </Menu>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 3 },
                    pt: { xs: 3, sm: 3 }, // Increased top padding for mobile
                    width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
                    bgcolor: '#f5f6fa',
                    minHeight: '100vh',
                    overflowX: 'hidden' // Prevent horizontal scroll
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
