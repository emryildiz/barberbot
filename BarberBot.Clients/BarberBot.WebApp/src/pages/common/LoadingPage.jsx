import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingPage = ({ message = 'Yükleniyor...' }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                bgcolor: 'background.default'
            }}
        >
            <CircularProgress size={60} thickness={4} sx={{ mb: 3, color: 'primary.main' }} />
            <Typography variant="h6" color="text.secondary">
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingPage;
