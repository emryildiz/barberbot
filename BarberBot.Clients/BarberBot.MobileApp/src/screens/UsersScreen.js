import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Switch, Alert } from 'react-native';
import api from '../services/api';
import BottomNavigator from '../components/BottomNavigator';

const UsersScreen = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback to barbers if users endpoint fails (e.g. permission issue)
            try {
                const response = await api.get('/barbers');
                setUsers(response.data);
            } catch (e) {
                console.error('Error fetching barbers fallback:', e);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUsers();
    }, []);

    const toggleStatus = async (user, type) => {
        const newActive = type === 'active' ? !user.isActive : user.isActive;
        const newOnLeave = type === 'leave' ? !user.isOnLeave : user.isOnLeave;

        // Optimistic update
        const updatedUsers = users.map(u =>
            u.id === user.id ? { ...u, isActive: newActive, isOnLeave: newOnLeave } : u
        );
        setUsers(updatedUsers);

        try {
            await api.put(`/users/${user.id}/status`, {
                isActive: newActive,
                isOnLeave: newOnLeave
            });
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Hata', 'Durum güncellenemedi.');
            // Revert
            setUsers(users);
        }
    };

    const renderUser = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.roleText}>{item.role}</Text>
            </View>

            <View style={styles.controls}>
                <View style={styles.controlItem}>
                    <Text style={styles.label}>Aktif</Text>
                    <Switch
                        value={item.isActive}
                        onValueChange={() => toggleStatus(item, 'active')}
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={item.isActive ? "#f5dd4b" : "#f4f3f4"}
                    />
                </View>

                {(item.role === 'Barber' || item.role === 'Owner') && (
                    <View style={styles.controlItem}>
                        <Text style={styles.label}>İzinli</Text>
                        <Switch
                            value={item.isOnLeave}
                            onValueChange={() => toggleStatus(item, 'leave')}
                            trackColor={{ false: "#767577", true: "#ff6b6b" }}
                            thumbColor={item.isOnLeave ? "#ff4757" : "#f4f3f4"}
                        />
                    </View>
                )}
            </View>
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
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
                        </View>
                    }
                />
            )}
            {/* BottomNavigator is not strictly required here if accessed from Dashboard, but good for consistency if it was a main tab. 
                Since it's accessed from Dashboard cards, maybe we don't need it or we need a back button. 
                The prompt implies it's a "tab" ("kullanıcılar sekmesinde"). 
                If it's a tab, it should have BottomNavigator. 
                Let's keep it consistent with previous screens. 
            */}
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
    userInfo: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    username: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    roleText: { fontSize: 14, color: '#666' },
    controls: { flexDirection: 'row', justifyContent: 'space-between' },
    controlItem: { flexDirection: 'row', alignItems: 'center' },
    label: { marginRight: 10, fontSize: 14, color: '#333' },
    emptyText: { color: '#999', fontSize: 16 }
});

export default UsersScreen;
