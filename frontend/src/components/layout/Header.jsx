import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useSocket } from '../../context/SocketContext';
import { useGetNotificationsQuery, useMarkAllAsReadMutation } from '../../features/notifications/notificationSlice';
import NotificationToast from '../ui/NotificationToast';
import { Bell } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { socket, isConnected } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const { data: notificationData, refetch } = useGetNotificationsQuery({ limit: 20 });
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const handleSignOut = () => {
    signOut();
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleSyncStarted = (data) => {
      setToasts(prev => [{
        id: Date.now(),
        type: 'info',
        title: `Syncing ${data.platform}...`,
        message: `Sync job ${data.jobId} started`,
      }, ...prev]);
      refetch();
    };

    const handleSyncCompleted = (data) => {
      const revenueFormatted = (data.summary.revenue || 0).toLocaleString('en-IN');
      setToasts(prev => [{
        id: Date.now(),
        type: 'success',
        title: `${data.platform} Sync Complete`,
        message: `₹${revenueFormatted} revenue, ${data.summary.orders || 0} orders`,
      }, ...prev]);
      refetch();
    };

    const handleSyncFailed = (data) => {
      setToasts(prev => [{
        id: Date.now(),
        type: 'error',
        title: `${data.platform} Sync Failed`,
        message: data.error,
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

  return (
    <header className="header">
      <div className="header__left">
        <span className="header__title">Vokation</span>
      </div>
      <div className="header__right">
        <div className="header__notifications">
          <button 
            className="header__bell"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="header__bell-dot"></span>
            )}
          </button>
          {showNotifications && (
            <div className="header__dropdown">
              <div className="header__dropdown-header">
                <span>Notifications</span>
                <button 
                  className="header__dropdown-mark-read"
                  onClick={() => {
                    markAllAsRead();
                    refetch();
                  }}
                >
                  Mark all read
                </button>
              </div>
              <div className="header__dropdown-body">
                {notificationData?.notifications?.length > 0 ? (
                  notificationData.notifications.map((notif) => (
                    <div key={notif._id} className={`header__notification ${!notif.read ? 'header__notification--unread' : ''}`}>
                      <div className="header__notification-content">
                        <div className="header__notification-title">{notif.title}</div>
                        <div className="header__notification-message">{notif.message}</div>
                      </div>
                      <div className="header__notification-time">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="header__notification-empty">
                    No notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {user && (
          <>
            <span className="header__user">
              {user.firstName} {user.lastName}
            </span>
            <button 
              className="header__btn" 
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
      <div className="header__toasts">
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

export default Header;