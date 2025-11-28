
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import api from '../services/api';
import BottomNavigator from '../components/BottomNavigator';

const DashboardScreen = ({ navigation }) => {
    const [stats, setStats] = useState({
        todayAppointments: 0,
        totalCustomers: 0,
        totalServices: 0,
        activeStaff: 0
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [appointmentsRes, customersRes, servicesRes, usersRes] = await Promise.all([
                api.get('/appointments'),
                api.get('/customers'),
                api.get('/services'),
                api.get('/barbers')
            ]);

            const today = new Date().toDateString();
            const todayApps = appointmentsRes.data.filter(a => new Date(a.startTime).toDateString() === today).length;

            // Get upcoming appointments for the list
            const upcoming = appointmentsRes.data
                .filter(a => new Date(a.startTime) >= new Date())
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                .slice(0, 5);

            setStats({
                todayAppointments: todayApps,
                totalCustomers: customersRes.data.length,
                totalServices: servicesRes.data.length,
                activeStaff: usersRes.data.length
            });
            setRecentAppointments(upcoming);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.headerSubtitle}>Hoşgeldiniz</Text>
                    </View>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>👤</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.gridContainer}>
                    {/* Black Card - Main Stat */}
                    <TouchableOpacity style={[styles.card, styles.blackCard]} onPress={() => navigation.navigate('Appointments')}>
                        <Text style={styles.cardValueWhite}>{stats.todayAppointments}</Text>
                        <Text style={styles.cardLabelWhite}>Bugünkü Randevular</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '40%' }]} />
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardFooterText}>0%</Text>
                            <Text style={styles.cardFooterText}>30%</Text>
                        </View>
                    </TouchableOpacity>

                    {/* White Card - Customers */}
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Customers')}>
                        <Text style={styles.cardValue}>{stats.totalCustomers}</Text>
                        <Text style={styles.cardLabel}>Toplam Müşteri</Text>
                        <View style={[styles.progressBarBg, { backgroundColor: '#e0e0e0' }]}>
                            <View style={[styles.progressBarFill, { width: '70%', backgroundColor: '#4facfe' }]} />
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardFooterTextDark}>0%</Text>
                            <Text style={styles.cardFooterTextDark}>70%</Text>
                        </View>
                    </TouchableOpacity>

                    {/* White Card - Services */}
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Services')}>
                        <Text style={styles.cardValue}>{stats.totalServices}</Text>
                        <Text style={styles.cardLabel}>Hizmetler</Text>
                        <View style={[styles.progressBarBg, { backgroundColor: '#e0e0e0' }]}>
                            <View style={[styles.progressBarFill, { width: '50%', backgroundColor: '#fbc2eb' }]} />
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardFooterTextDark}>0%</Text>
                            <Text style={styles.cardFooterTextDark}>50%</Text>
                        </View>
                    </TouchableOpacity>

                    {/* White Card - Staff */}
                    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Users')}>
                        <Text style={styles.cardValue}>{stats.activeStaff}</Text>
                        <Text style={styles.cardLabel}>Personel</Text>
                        <View style={[styles.progressBarBg, { backgroundColor: '#e0e0e0' }]}>
                            <View style={[styles.progressBarFill, { width: '80%', backgroundColor: '#43e97b' }]} />
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.cardFooterTextDark}>0%</Text>
                            <Text style={styles.cardFooterTextDark}>80%</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Recent List Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
                        <Text style={styles.seeAllButton}>Tümü</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.listContainer}>
                    {recentAppointments.map((item) => (
                        <View key={item.id} style={styles.listItem}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitials}>{item.customer?.name?.substring(0, 2).toUpperCase() || 'M'}</Text>
                            </View>
                            <View style={styles.listItemContent}>
                                <Text style={styles.listItemTitle}>{item.customer?.name}</Text>
                                <Text style={styles.listItemSubtitle}>
                                    {new Date(item.startTime).toLocaleDateString('tr-TR')} • {new Date(item.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <View style={styles.listItemRight}>
                                <Text style={styles.listItemPrice}>{item.service?.name}</Text>
                                <View style={styles.statusDot} />
                            </View>
                        </View>
                    ))}
                    {recentAppointments.length === 0 && (
                        <Text style={styles.emptyText}>Yaklaşan randevu yok.</Text>
                    )}
                </View>

            </ScrollView>

            <BottomNavigator navigation={navigation} activeTab="Dashboard" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fd' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#000' },
    headerSubtitle: { fontSize: 16, color: '#888', marginTop: 5 },
    avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 24 },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
    blackCard: { backgroundColor: '#000' },

    cardValue: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 5 },
    cardValueWhite: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
    cardLabel: { fontSize: 14, color: '#888', marginBottom: 15 },
    cardLabelWhite: { fontSize: 14, color: '#aaa', marginBottom: 15 },

    progressBarBg: { height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 10 },
    progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    cardFooterText: { fontSize: 12, color: '#666' },
    cardFooterTextDark: { fontSize: 12, color: '#aaa' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    seeAllButton: { fontSize: 14, color: '#888', fontWeight: '600' },

    listContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 10 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    avatarCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#f5f6fa', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarInitials: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    listItemContent: { flex: 1 },
    listItemTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 },
    listItemSubtitle: { fontSize: 13, color: '#888' },
    listItemRight: { alignItems: 'flex-end' },
    listItemPrice: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4facfe' },
    emptyText: { textAlign: 'center', color: '#888', padding: 20 }
});

export default DashboardScreen;
