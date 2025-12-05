import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SentimentDissatisfied } from '@mui/icons-material';

const NotFoundPage = () => {
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
                <SentimentDissatisfied sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    404
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
                    Aradığınız sayfa bulunamadı.
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                    Gitmek istediğiniz sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı olabilir.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/admin/dashboard')}
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                >
                    Ana Sayfaya Dön
                </Button>
            </Box>
        </Container>
    );
};

export default NotFoundPage;
