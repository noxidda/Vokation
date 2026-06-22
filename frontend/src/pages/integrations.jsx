import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetIntegrationsQuery, useDisconnectIntegrationMutation, useSyncIntegrationMutation } from '../features/integrations/integrationsSlice';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import NotificationToast from '../components/ui/NotificationToast';
import { ShoppingBag, BarChart2, Megaphone, Mail } from 'lucide-react';
import './Integrations.css';

const Integrations = () => {
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState(null);
  const { data: integrations, isLoading, error, refetch } = useGetIntegrationsQuery();
  const [disconnectIntegration] = useDisconnectIntegrationMutation();
  const [syncIntegration, { isLoading: isSyncing }] = useSyncIntegrationMutation();

  // Handle callback success/error
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'shopify') {
      setToast({
        type: 'success',
        title: 'Shopify Connected',
        message: 'Your Shopify store has been connected successfully!',
      });
      refetch();
    } else if (error === 'shopify') {
      setToast({
        type: 'error',
        title: 'Connection Failed',
        message: 'Failed to connect Shopify. Please try again.',
      });
    }
  }, [searchParams, refetch]);

  const platforms = [
    { id: 'shopify', name: 'Shopify', icon: <ShoppingBag size={20} />, available: true },
    { id: 'google_analytics', name: 'Google Analytics', icon: <BarChart2 size={20} />, available: false },
    { id: 'facebook_ads', name: 'Facebook Ads', icon: <Megaphone size={20} />, available: false },
    { id: 'mailchimp', name: 'Mailchimp', icon: <Mail size={20} />, available: false },
  ];

  const getPlatformStatus = (platformId) => {
    const integration = integrations?.find(i => i.platform === platformId);
    if (!integration) return { connected: false, data: null };
    return { 
      connected: integration.isActive,
      data: integration,
    };
  };

  const handleConnect = (platformId) => {
    if (platformId === 'shopify') {
      const shop = prompt('Enter your Shopify store domain (e.g., mystore.myshopify.com):');
      if (shop) {
        window.location.href = `${import.meta.env.VITE_API_URL}/integrations/shopify/connect?shop=${shop}`;
      }
    }
  };

  const handleDisconnect = async (platformId) => {
    if (window.confirm(`Are you sure you want to disconnect ${platformId}?`)) {
      try {
        await disconnectIntegration({ platform: platformId }).unwrap();
        refetch();
        setToast({
          type: 'success',
          title: 'Disconnected',
          message: `${platformId} has been disconnected.`,
        });
      } catch (error) {
        setToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to disconnect. Please try again.',
        });
      }
    }
  };

  const handleSync = async (platformId) => {
    try {
      await syncIntegration({ platform: platformId }).unwrap();
      setToast({
        type: 'info',
        title: 'Sync Started',
        message: `Syncing ${platformId} data...`,
      });
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Sync Failed',
        message: error.message || 'Failed to start sync',
      });
    }
  };

  if (error) {
    return (
      <div className="integrations">
        <h1 className="integrations__title">Integrations</h1>
        <div className="integrations__error">
          <p>Failed to load integrations</p>
          <button className="integrations__retry" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations">
      <h1 className="integrations__title">Integrations</h1>
      <p className="integrations__subtitle">
        Connect your platforms to sync data
      </p>

      {toast && (
        <NotificationToast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      <div className="integrations__grid grid grid--2">
        {platforms.map((platform) => {
          const status = getPlatformStatus(platform.id);
          
          return (
            <Card 
              key={platform.id} 
              accent={status.connected}
              className={`integration-card ${status.connected ? 'integration-card--connected' : 'integration-card--disconnected'}`}
            >
              <div className="integration-card__content">
                <div className="integration-card__header">
                  <span className="integration-card__icon">{platform.icon}</span>
                  <h3 className="integration-card__name">{platform.name}</h3>
                  <StatusBadge variant={status.connected ? 'success' : 'info'}>
                    {status.connected ? 'Connected' : 'Not Connected'}
                  </StatusBadge>
                </div>
                
                {status.connected && status.data && (
                  <div className="integration-card__details">
                    <div className="integration-card__store">
                      {status.data.platformStoreId}
                    </div>
                    {status.data.cachedData?.lastFetched && (
                      <div className="integration-card__last-synced">
                        Last synced: {new Date(status.data.cachedData.lastFetched).toLocaleString()}
                      </div>
                    )}
                    {status.data.cachedData?.metrics && (
                      <div className="integration-card__metrics">
                        <span>₹{status.data.cachedData.metrics.revenue?.toLocaleString('en-IN') || 0} revenue</span>
                        <span>{status.data.cachedData.metrics.orders || 0} orders</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="integration-card__actions">
                  {status.connected ? (
                    <>
                      <button 
                        className="integration-card__btn integration-card__btn--sync"
                        onClick={() => handleSync(platform.id)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? 'Syncing...' : 'Sync'}
                      </button>
                      <button 
                        className="integration-card__btn integration-card__btn--disconnect"
                        onClick={() => handleDisconnect(platform.id)}
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button 
                      className="integration-card__btn integration-card__btn--connect"
                      onClick={() => handleConnect(platform.id)}
                      disabled={!platform.available}
                    >
                      {platform.available ? 'Connect' : 'Coming Soon'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Integrations;