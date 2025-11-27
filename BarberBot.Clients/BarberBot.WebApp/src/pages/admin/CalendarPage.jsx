import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr'; // Turkish locale
import api from '../../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css'; // Import custom dark theme styles
import { Box, Typography, Paper, CircularProgress } from '@mui/material';

// Set moment locale to Turkish
moment.locale('tr');
const localizer = momentLocalizer(moment);

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/appointments');
            const formattedEvents = response.data.map(app => ({
                id: app.id,
                title: `${app.customer?.name || 'Müşteri'} - ${app.service?.name || 'Hizmet'} (${app.barber?.name || 'Berber'})`,
                start: new Date(app.startTime),
                end: new Date(app.endTime),
                resource: app
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const messages = {
        allDay: 'Tüm Gün',
        previous: 'Geri',
        next: 'İleri',
        today: 'Bugün',
        month: 'Ay',
        week: 'Hafta',
        day: 'Gün',
        agenda: 'Ajanda',
        date: 'Tarih',
        time: 'Saat',
        event: 'Randevu',
        noEventsInRange: 'Bu aralıkta randevu yok.',
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box sx={{ height: 'calc(100vh - 100px)' }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" color="primary" fontWeight="bold">
                    Randevu Takvimi
                </Typography>
            </Box>

            <Paper sx={{ height: '100%', p: 2, backgroundColor: '#1e1e1e', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    defaultView={Views.WEEK}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    messages={messages}
                    min={new Date(0, 0, 0, 8, 0, 0)} // Start at 08:00
                    max={new Date(0, 0, 0, 22, 0, 0)} // End at 22:00
                    step={30} // 30 minute slots
                    timeslots={2}
                    popup
                />
            </Paper>
        </Box>
    );
};

export default CalendarPage;
