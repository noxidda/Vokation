import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/integrations', label: 'Integrations', icon: '🔌' },
    { path: '/team', label: 'Team', icon: '👥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/audit-log', label: 'Audit Log', icon: '📋' },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="sidebar__footer">
        <button className="sidebar__upgrade">
          ⚡ Upgrade to Pro
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;