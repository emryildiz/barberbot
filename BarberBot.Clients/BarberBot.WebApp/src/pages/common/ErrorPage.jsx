import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ title = "Bir Hata Oluştu", message = "Beklenmedik bir hata meydana geldi. Lütfen daha sonra tekrar deneyiniz." }) => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    textAlign: 'center'
                }}
            >
                <ErrorOutline sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: 600 }}>
                    {message}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => window.location.reload()}
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                        Yenile
                    </Button>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/admin/dashboard')}
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                        Ana Sayfaya Dön
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default ErrorPage;
