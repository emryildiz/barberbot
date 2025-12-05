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
    CircularProgress,
    Chip
} from '@mui/material';
import api from '../../services/api';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
            setFilteredCustomers(response.data);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
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
            <Box mb={4}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Müşteriler
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', boxShadow: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ad Soyad</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Telefon Numarası</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ziyaret Sayısı</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredCustomers.map((customer) => (
                            <TableRow key={customer.id} hover>
                                <TableCell>{customer.name}</TableCell>
                                <TableCell>{customer.phoneNumber}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={customer.visitCount}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(0, 0, 0, 0.08)',
                                            fontWeight: 'bold',
                                            minWidth: 40
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    Müşteri bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CustomersPage;
