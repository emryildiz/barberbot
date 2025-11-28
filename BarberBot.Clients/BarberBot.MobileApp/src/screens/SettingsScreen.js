import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import authService from '../services/authService';
import BottomNavigator from '../components/BottomNavigator';

const SettingsScreen = ({ navigation }) => {
    const handleLogout = async () => {
        await authService.logout();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </View>
            <BottomNavigator navigation={navigation} activeTab="Settings" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f6fa' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    button: {
        backgroundColor: '#ff4757', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10, width: '100%', alignItems: 'center'
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default SettingsScreen;
