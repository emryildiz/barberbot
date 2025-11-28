import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../services/api';
import BottomNavigator from '../components/BottomNavigator';

const CustomersScreen = ({ navigation }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCustomers();
    }, []);

    const renderCustomer = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phoneNumber}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    data={customers}
                    renderItem={renderCustomer}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>Müşteri bulunamadı.</Text>
                        </View>
                    }
                />
            )}
            <BottomNavigator navigation={navigation} activeTab="Customers" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    list: { padding: 15 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
    },
    name: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    phone: { fontSize: 16, color: '#666' },
    emptyText: { color: '#999', fontSize: 16 }
});

export default CustomersScreen;
