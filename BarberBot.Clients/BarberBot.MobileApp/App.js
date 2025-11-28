import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

import AppointmentsScreen from './src/screens/AppointmentsScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import UsersScreen from './src/screens/UsersScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

import { navigationRef } from './src/services/navigationRef';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Appointments" component={AppointmentsScreen} />
          <Stack.Screen name="Customers" component={CustomersScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />

          <Stack.Screen name="Services" component={ServicesScreen} options={{ headerShown: true, title: 'Hizmetler' }} />
          <Stack.Screen name="Users" component={UsersScreen} options={{ headerShown: true, title: 'Kullanıcılar' }} />
          <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: true, title: 'Raporlar' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
