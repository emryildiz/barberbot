import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaCalendarAlt, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';
import '../../index.css';

const Sidebar = () => {
  const navItems = [
    { path: '/admin/calendar', name: 'Calendar', icon: <FaCalendarAlt /> },
    { path: '/admin/appointments', name: 'Appointments', icon: <FaClipboardList /> },
  ];

  return (
    <div className="glass-panel" style={{
      width: '250px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem',
      borderRadius: '0 16px 16px 0',
      zIndex: 100
    }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary-color)', letterSpacing: '1px' }}>BarberBot</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Admin Panel</p>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '1rem' }}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  background: isActive ? 'var(--primary-color)' : 'transparent',
                  transition: 'all 0.3s ease',
                  fontWeight: isActive ? '600' : '400'
                })}
              >
                <span style={{ marginRight: '12px' }}>{item.icon}</span>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        background: 'transparent',
        color: 'var(--danger)',
        fontSize: '1rem',
        marginTop: 'auto'
      }}>
        <FaSignOutAlt style={{ marginRight: '12px' }} />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
