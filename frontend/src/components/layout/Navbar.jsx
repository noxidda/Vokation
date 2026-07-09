import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { useGetNotificationsQuery, useMarkAllAsReadMutation } from '../../features/notifications/notificationSlice';
import { useGetSubscriptionStatusQuery } from '../../features/payment/paymentSlice';
import NotificationToast from '../ui/NotificationToast';
import { Bell } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const { data: notificationData, refetch } = useGetNotificationsQuery({ limit: 20 }, {
    skip: !isSignedIn,
  });
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const { data: subscription } = useGetSubscriptionStatusQuery(undefined, {
    skip: !isSignedIn,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    if (!socket) return;

    const handleSyncStarted = (data) => {
      setToasts(prev => [{
        id: Date.now(),
        type: 'info',
        title: `Sync Process Initiated`,
        message: `Sync job for platform ${data.platform} has started.`,
      }, ...prev]);
      refetch();
    };

    const handleSyncCompleted = (data) => {
      const revenueFormatted = (data.summary.revenue || 0).toLocaleString('en-IN');
      setToasts(prev => [{
        id: Date.now(),
        type: 'success',
        title: `Sync Process Completed`,
        message: `Data synchronized successfully. Summary: ₹${revenueFormatted} revenue, ${data.summary.orders || 0} orders.`,
      }, ...prev]);
      refetch();
    };

    const handleSyncFailed = (data) => {
      setToasts(prev => [{
        id: Date.now(),
        type: 'error',
        title: `Sync Process Failed`,
        message: data.error || 'An error occurred during synchronization.',
      }, ...prev]);
      refetch();
    };

    socket.on('sync:started', handleSyncStarted);
    socket.on('sync:completed', handleSyncCompleted);
    socket.on('sync:failed', handleSyncFailed);

    return () => {
      socket.off('sync:started', handleSyncStarted);
      socket.off('sync:completed', handleSyncCompleted);
      socket.off('sync:failed', handleSyncFailed);
    };
  }, [socket, refetch]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const unreadCount = notificationData?.unreadCount || 0;
  const isAdmin = user?.role === 'admin';
  const isPro = subscription?.tier === 'pro';

  return (
    <header className="navbar">
      <div className="navbar__container">
        <div className="navbar__left">
          <Link to="/" className="navbar__brand">
            VOKATION
          </Link>
          {isSignedIn && (
            <nav className="navbar__links">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/integrations" 
                className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              >
                Integrations
              </NavLink>
              <NavLink 
                to="/team" 
                className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              >
                Team
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink 
                    to="/jobs" 
                    className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                  >
                    Sync Jobs
                  </NavLink>
                  <NavLink 
                    to="/audit-log" 
                    className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                  >
                    Audit Log
                  </NavLink>
                  <NavLink 
                    to="/settings" 
                    className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                  >
                    Settings
                  </NavLink>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="navbar__right">
          {isSignedIn && (
            <>
              {isPro ? (
                <span className="navbar__badge navbar__badge--pro">PRO</span>
              ) : (
                <Link to="/pricing" className="navbar__upgrade-btn">
                  Upgrade
                </Link>
              )}

              <div className="navbar__notifications">
                <button 
                  className="navbar__bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="navbar__bell-dot"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="navbar__dropdown">
                    <div className="navbar__dropdown-header">
                      <span>Notifications</span>
                      <button 
                        className="navbar__dropdown-mark-read"
                        onClick={() => {
                          markAllAsRead();
                          refetch();
                        }}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="navbar__dropdown-body">
                      {notificationData?.notifications?.length > 0 ? (
                        notificationData.notifications.map((notif) => (
                          <div key={notif._id} className={`navbar__notification ${!notif.read ? 'navbar__notification--unread' : ''}`}>
                            <div className="navbar__notification-content">
                              <div className="navbar__notification-title">{notif.title}</div>
                              <div className="navbar__notification-message">{notif.message}</div>
                            </div>
                            <div className="navbar__notification-time">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="navbar__notification-empty">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {user && (
                <div className="navbar__user-section">
                  <span className="navbar__user-name">
                    {user.firstName || user.email}
                  </span>
                  <button 
                    className="navbar__signout-btn" 
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="navbar__toasts">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            duration={5000}
          />
        ))}
      </div>
    </header>
  );
};

export default Navbar;