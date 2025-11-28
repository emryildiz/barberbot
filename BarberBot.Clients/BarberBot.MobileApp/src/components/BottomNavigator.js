import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const BottomNavigator = ({ navigation, activeTab }) => {
    const tabs = [
        { name: 'Dashboard', label: 'Home', icon: '🏠' },
        { name: 'Appointments', label: 'Randevular', icon: '📅' },
        { name: 'Customers', label: 'Müşteriler', icon: '👥' },
        { name: 'Settings', label: 'Ayarlar', icon: '⚙️' },
    ];

    return (
        <View style={styles.container}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.name}
                    style={styles.tab}
                    onPress={() => navigation.navigate(tab.name)}
                >
                    <Text style={[styles.icon, activeTab === tab.name && styles.activeIcon]}>
                        {tab.icon}
                    </Text>
                    <Text style={[styles.label, activeTab === tab.name && styles.activeLabel]}>
                        {tab.label}
                    </Text>
                    {activeTab === tab.name && <View style={styles.indicator} />}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingBottom: 20, // Safe area
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 24,
        color: '#999',
        marginBottom: 4,
    },
    activeIcon: {
        color: '#000',
    },
    label: {
        fontSize: 10,
        color: '#999',
        fontWeight: '500',
    },
    activeLabel: {
        color: '#000',
        fontWeight: 'bold',
    },
    indicator: {
        position: 'absolute',
        top: -10,
        width: 40,
        height: 3,
        backgroundColor: '#000',
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    }
});

export default BottomNavigator;
