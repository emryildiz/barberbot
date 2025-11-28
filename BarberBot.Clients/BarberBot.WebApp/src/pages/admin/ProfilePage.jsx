import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    Divider,
    Chip
} from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import api from '../../services/api';
import authService from '../../services/authService';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
            return;
        }

        if (passwords.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır.' });
            return;
        }

        setSaving(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi.' });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Error changing password:', error);
            setMessage({
                type: 'error',
                text: error.response?.data || 'Şifre değiştirilirken bir hata oluştu.'
            });
        } finally {
            setSaving(false);
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
        <Box maxWidth="lg" mx="auto" sx={{ mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, color: 'text.primary' }}>
                Profil Ayarları
            </Typography>

            <Grid container spacing={4}>
                {/* Profile Card */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{
                        p: 4,
                        borderRadius: 4,
                        textAlign: 'center',
                        background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <Box sx={{
                            width: 120,
                            height: 120,
                            bgcolor: 'black',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3.5rem',
                            fontWeight: 'bold',
                            mx: 'auto',
                            mb: 3,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}>
                            {user?.username?.charAt(0).toUpperCase()}
                        </Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {user?.username}
                        </Typography>
                        <Chip
                            label={user?.role}
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 'bold', px: 2 }}
                        />
                    </Paper>
                </Grid>

                {/* Password Change Form */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{
                        p: 4,
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <Box display="flex" alignItems="center" mb={3}>
                            <Box sx={{
                                p: 1,
                                borderRadius: 2,
                                bgcolor: 'primary.light',
                                color: 'primary.main',
                                mr: 2,
                                display: 'flex'
                            }}>
                                <Lock />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    Şifre Değiştir
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Hesap güvenliğinizi sağlamak için güçlü bir şifre kullanın.
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 4 }} />

                        {message.text && (
                            <Alert severity={message.type} sx={{ mb: 4, borderRadius: 2 }}>
                                {message.text}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Mevcut Şifre"
                                        name="currentPassword"
                                        type="password"
                                        value={passwords.currentPassword}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Yeni Şifre"
                                        name="newPassword"
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                        helperText="En az 6 karakter"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Yeni Şifre (Tekrar)"
                                        name="confirmPassword"
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        variant="outlined"
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box display="flex" justifyContent="flex-end" mt={2}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={<Save />}
                                            disabled={saving}
                                            size="large"
                                            sx={{
                                                borderRadius: 2,
                                                px: 4,
                                                py: 1.5,
                                                bgcolor: 'black',
                                                '&:hover': { bgcolor: '#333' },
                                                textTransform: 'none',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProfilePage;
