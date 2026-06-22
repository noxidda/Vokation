import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGetSubscriptionStatusQuery } from '../../features/payment/paymentSlice';
import { 
  LayoutDashboard, 
  Link2, 
  Users, 
  RefreshCw, 
  FileText, 
  Settings, 
  Zap 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const { data: subscription } = useGetSubscriptionStatusQuery();
  const isAdmin = user?.role === 'admin';
  const isPro = subscription?.tier === 'pro';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, required: null },
    { path: '/integrations', label: 'Integrations', icon: <Link2 size={18} />, required: null },
    { path: '/team', label: 'Team', icon: <Users size={18} />, required: null },
    { path: '/jobs', label: 'Sync Jobs', icon: <RefreshCw size={18} />, required: 'admin' },
    { path: '/audit-log', label: 'Audit Log', icon: <FileText size={18} />, required: 'admin' },
    { path: '/settings', label: 'Settings', icon: <Settings size={18} />, required: 'admin' },
  ];

  const filteredItems = navItems.filter(item => 
    !item.required || (item.required === 'admin' && isAdmin)
  );

  return (
    <nav className="sidebar">
      <div className="sidebar__nav">
        {filteredItems.map((item) => (
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
        {!isPro ? (
          <NavLink to="/pricing" className="sidebar__upgrade">
            <Zap size={14} /> Upgrade to Pro
          </NavLink>
        ) : (
          <div className="sidebar__pro-badge">
            <span className="sidebar__pro-label">PRO</span>
            <span className="sidebar__pro-status">Active</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;