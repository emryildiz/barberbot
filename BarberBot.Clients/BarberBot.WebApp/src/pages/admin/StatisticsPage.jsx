import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Tabs,
    Tab,
    Card,
    CardContent,
    LinearProgress,
    TextField,
    InputAdornment
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { CalendarMonth } from '@mui/icons-material';
import api from '../../services/api';

const StatisticsPage = () => {
    const [tabValue, setTabValue] = useState(0);
    const [dashboardStats, setDashboardStats] = useState([]);
    const [serviceStats, setServiceStats] = useState({ pieChart: [], popular: [] });
    const [summaryStats, setSummaryStats] = useState({ totalAppointments: 0, whatsappAppointments: 0, occupancyRate: 0 });
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('thisMonth');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardRes, servicesRes, summaryRes] = await Promise.all([
                    api.get(`/statistics/dashboard?timeRange=${timeRange}`),
                    api.get(`/statistics/services?timeRange=${timeRange}`),
                    api.get(`/statistics/summary?timeRange=${timeRange}`)
                ]);
                setDashboardStats(dashboardRes.data);

                // Update pie chart colors to black/white/gray theme
                const grayScaleColors = ['#000000', '#424242', '#757575', '#BDBDBD', '#E0E0E0'];
                const updatedServiceStats = {
                    ...servicesRes.data,
                    pieChart: servicesRes.data.pieChart.map((item, index) => ({
                        ...item,
                        color: grayScaleColors[index % grayScaleColors.length]
                    }))
                };
                setServiceStats(updatedServiceStats);
                setSummaryStats(summaryRes.data);
            } catch (error) {
                console.error("Error fetching statistics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const getTitleDate = () => {
        const now = new Date();
        if (timeRange === 'thisMonth') {
            return now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        } else if (timeRange === 'lastMonth') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return lastMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        } else if (timeRange === 'thisYear') {
            return now.getFullYear().toString();
        }
        return '';
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
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                    Raporlar
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    İşletmeniz için detaylı raporlar ve istatistikler görüntüleyin.
                </Typography>
            </Box>

            {/* Filter Section */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>
                            Zaman Aralığı
                        </Typography>
                        <TextField
                            select
                            SelectProps={{ native: true }}
                            variant="outlined"
                            size="small"
                            sx={{ width: 200 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonth fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <option value="thisMonth">Bu Ay</option>
                            <option value="lastMonth">Geçen Ay</option>
                            <option value="thisYear">Bu Yıl</option>
                        </TextField>
                    </Box>
                    <Box>
                        {/* Additional filters can go here */}
                    </Box>
                </Box>
            </Paper>

            {/* Tabs */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="inherit"
                    variant="fullWidth"
                    sx={{
                        bgcolor: '#f5f5f5',
                        '& .MuiTabs-indicator': { backgroundColor: 'black' },
                        '& .Mui-selected': { color: 'black', fontWeight: 'bold' }
                    }}
                >
                    <Tab label="Randevular" />
                    <Tab label="Hizmet Dağılımı" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {tabValue === 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
                        Randevu Raporu: {getTitleDate()}
                    </Typography>

                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: 2, textAlign: 'center', py: 2 }}>
                                <CardContent>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                                        {summaryStats.totalAppointments}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Toplam Randevu
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: 2, textAlign: 'center', py: 2 }}>
                                <CardContent>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                                        {summaryStats.whatsappAppointments}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        WhatsApp Randevuları
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ borderRadius: 2, textAlign: 'center', py: 2 }}>
                                <CardContent>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                                        {summaryStats.occupancyRate}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Doluluk Oranı
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Paper sx={{ p: 3, borderRadius: 2, height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={dashboardStats}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: 20 }} />
                                <Bar dataKey="totalCount" name="Toplam Randevu" fill="#000000" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="whatsappCount" name="WhatsApp Randevuları" fill="#BDBDBD" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Box>
            )}

            {tabValue === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
                        Hizmet Dağılımı Raporu: {getTitleDate()}
                    </Typography>

                    <Paper sx={{ p: 4, borderRadius: 2 }}>
                        <Grid container spacing={4} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <Box height={300} position="relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={serviceStats.pieChart}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="60%"
                                                outerRadius="80%"
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {serviceStats.pieChart.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Legend Overlay could go here or use Recharts Legend */}
                                </Box>
                                <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2} mt={2}>
                                    {serviceStats.pieChart.map((entry, index) => (
                                        <Box key={index} display="flex" alignItems="center">
                                            <Box width={12} height={12} bgcolor={entry.color} mr={1} borderRadius={0.5} />
                                            <Typography variant="caption" color="text.secondary">
                                                {entry.name}: {Math.round(entry.value)}%
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                    En Popüler Hizmetler
                                </Typography>
                                <Box mt={3}>
                                    {serviceStats.popular.map((service, index) => (
                                        <Box key={index} mb={3}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {service.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {service.count} randevu
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={service.percentage}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: '#f0f0f0',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: serviceStats.pieChart.find(p => p.name === service.name)?.color || '#2e2e3e',
                                                        borderRadius: 4
                                                    }
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default StatisticsPage;
