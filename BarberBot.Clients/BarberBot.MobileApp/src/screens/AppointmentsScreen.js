import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../services/api';
import BottomNavigator from '../components/BottomNavigator';

const AppointmentsScreen = ({ navigation }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/appointments');
            const sorted = response.data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            setAppointments(sorted);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAppointments();
    }, []);

    const renderAppointment = ({ item }) => {
        const date = new Date(item.startTime);
        const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('tr-TR');

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.customerName}>{item.customer?.name || 'İsimsiz Müşteri'}</Text>
                    <View style={[styles.badge, item.status === 'Confirmed' ? styles.badgeSuccess : styles.badgeWarning]}>
                        <Text style={styles.badgeText}>{item.status === 'Confirmed' ? 'Onaylı' : 'Bekliyor'}</Text>
                    </View>
                </View>

                <Text style={styles.serviceName}>{item.service?.name}</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>Tarih:</Text>
                    <Text style={styles.value}>{dateStr} {timeStr}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Berber:</Text>
                    <Text style={styles.value}>{item.user?.username || 'Belirtilmemiş'}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Tel:</Text>
                    <Text style={styles.value}>{item.customer?.phoneNumber}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    data={appointments}
                    renderItem={renderAppointment}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>Randevu bulunamadı.</Text>
                        </View>
                    }
                />
            )}
            <BottomNavigator navigation={navigation} activeTab="Appointments" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    customerName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    serviceName: { fontSize: 16, color: '#666', marginBottom: 10, fontWeight: '500' },
    row: { flexDirection: 'row', marginBottom: 5 },
    label: { width: 60, color: '#999', fontSize: 14 },
    value: { color: '#333', fontSize: 14, fontWeight: '500' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeSuccess: { backgroundColor: '#e1f5fe' },
    badgeWarning: { backgroundColor: '#fff3e0' },
    badgeText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    emptyText: { color: '#999', fontSize: 16 }
});

export default AppointmentsScreen;
