import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import CalendarPage from './pages/admin/CalendarPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import AddAppointmentPage from './pages/admin/AddAppointmentPage';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

import StatisticsPage from './pages/admin/StatisticsPage';
import BarbersPage from './pages/admin/BarbersPage';
import CustomersPage from './pages/admin/CustomersPage';
import ServicesPage from './pages/admin/ServicesPage';
import SettingsPage from './pages/admin/SettingsPage';
import UsersPage from './pages/admin/UsersPage';
import ProfilePage from './pages/admin/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/common/NotFoundPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/new" element={<AddAppointmentPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="barbers" element={<BarbersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Default Redirect */}
          {/* 404 Not Found */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
