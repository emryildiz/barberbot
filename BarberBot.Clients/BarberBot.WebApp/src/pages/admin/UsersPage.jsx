import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import api from '../../services/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Barber' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleAddUser = async () => {
        try {
            await api.post('/users', newUser);
            setOpen(false);
            setNewUser({ username: '', password: '', role: 'Barber' });
            fetchUsers();
        } catch (error) {
            setError('Kullanıcı eklenirken bir hata oluştu.');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin': return 'error';
            case 'Owner': return 'primary';
            case 'Barber': return 'success';
            default: return 'default';
        }
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: isMobile ? '1.5rem' : '2.125rem' }}>
                    Kullanıcı Yönetimi
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    size={isMobile ? "small" : "medium"}
                    sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
                >
                    {isMobile ? "Ekle" : "Yeni Kullanıcı Ekle"}
                </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f9fafb' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Kullanıcı Adı</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                            <PersonIcon color="action" />
                                        </Box>
                                        <Typography variant="body1" fontWeight="medium">
                                            {user.username}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.role}
                                        color={getRoleColor(user.role)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDeleteUser(user.id)}
                                        disabled={user.role === 'Admin' || user.role === 'Owner'} // Prevent deleting admins/owners for safety
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Kullanıcı Adı"
                        fullWidth
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Şifre"
                        type="password"
                        fullWidth
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={newUser.role}
                            label="Rol"
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <MenuItem value="Admin">Admin</MenuItem>
                            <MenuItem value="Owner">Owner (Sahip)</MenuItem>
                            <MenuItem value="Barber">Barber (Berber)</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Admin ve Owner tüm izinlere sahiptir. Barber sadece kendi randevularını görür.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleAddUser} variant="contained">Ekle</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UsersPage;
