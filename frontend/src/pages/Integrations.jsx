import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetIntegrationsQuery, useDisconnectIntegrationMutation, useSyncIntegrationMutation } from '../features/integrations/integrationsSlice';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import NotificationToast from '../components/ui/NotificationToast';
import Modal from '../components/ui/Modal';
import './Integrations.css';

const Integrations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [toast, setToast] = useState(null);
  const { data: integrations, isLoading, error, refetch } = useGetIntegrationsQuery();
  const [disconnectIntegration] = useDisconnectIntegrationMutation();
  const [syncIntegration, { isLoading: isSyncing }] = useSyncIntegrationMutation();

  const [showShopifyModal, setShowShopifyModal] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (success) {
      setToast({
        type: 'success',
        title: 'Integration Established',
        message: `The ${success} platform connection has been successfully established.`,
      });
      setSearchParams({}, { replace: true });
      refetch();
    } else if (errorParam) {
      const msg = searchParams.get('msg');
      setToast({
        type: 'error',
        title: 'Integration Failure',
        message: msg || `Failed to establish ${errorParam} platform connection. Please verify credentials.`,
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refetch]);

  const platforms = [
    { id: 'shopify', name: 'Shopify Storefront', available: true },
    { id: 'google_analytics', name: 'Google Analytics', available: true },
    { id: 'mailchimp', name: 'Mailchimp Campaign Manager', available: true },
  ];

  const getPlatformStatus = (platformId) => {
    const integration = integrations?.find(i => i.platform === platformId);
    if (!integration) return { connected: false, data: null };
    return { 
      connected: integration.isActive,
      data: integration,
    };
  };

  const handleConnectClick = (platformId) => {
    const token = localStorage.getItem('clerk-token');
    if (platformId === 'shopify') {
      setShopifyDomain('');
      setShowShopifyModal(true);
    } else if (platformId === 'google_analytics' || platformId === 'mailchimp') {
      window.location.href = `${import.meta.env.VITE_API_URL}/integrations/${platformId}/connect?token=${token}`;
    }
  };

  const handleShopifyConnectSubmit = (e) => {
    if (e) e.preventDefault();
    if (shopifyDomain.trim()) {
      setShowShopifyModal(false);
      const token = localStorage.getItem('clerk-token');
      window.location.href = `${import.meta.env.VITE_API_URL}/integrations/shopify/connect?shop=${shopifyDomain.trim()}&token=${token}`;
    }
  };

  const handleDisconnect = async (platformId) => {
    if (window.confirm(`Confirm disconnection of ${platformId} integration?`)) {
      try {
        await disconnectIntegration({ platform: platformId }).unwrap();
        refetch();
        setToast({
          type: 'success',
          title: 'Integration Terminated',
          message: `The ${platformId} platform has been disconnected.`,
        });
      } catch (error) {
        setToast({
          type: 'error',
          title: 'Operation Failed',
          message: 'Failed to terminate integration. Please retry.',
        });
      }
    }
  };

  const handleSync = async (platformId) => {
    try {
      await syncIntegration({ platform: platformId }).unwrap();
      setToast({
        type: 'info',
        title: 'Synchronization Initiated',
        message: `Request to sync ${platformId} data has been dispatched.`,
      });
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Synchronization Failed',
        message: error.message || 'Failed to dispatch synchronization request.',
      });
    }
  };

  if (error) {
    return (
      <div className="integrations">
        <h1 className="integrations__title">Platform Integrations</h1>
        <div className="integrations__error">
          <p>Failed to retrieve integrations.</p>
          <button className="integrations__retry" onClick={refetch}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations">
      <h1 className="integrations__title">Platform Integrations</h1>
      <p className="integrations__subtitle">
        Connect external API providers to consolidate organization metrics.
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
                  <h3 className="integration-card__name">{platform.name}</h3>
                  <StatusBadge variant={status.connected ? 'success' : 'info'}>
                    {status.connected ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </div>
                
                {status.connected && status.data && (
                  <div className="integration-card__details">
                    <div className="integration-card__store">
                      Endpoint ID: {status.data.platformStoreId}
                    </div>
                    {status.data.cachedData?.lastFetched && (
                      <div className="integration-card__last-synced">
                        Last sync: {new Date(status.data.cachedData.lastFetched).toLocaleString()}
                      </div>
                    )}
                    {status.data.cachedData?.metrics && (
                      <div className="integration-card__metrics">
                        <span>₹{status.data.cachedData.metrics.revenue?.toLocaleString('en-IN') || 0} Gross</span>
                        <span>{status.data.cachedData.metrics.orders || 0} Transactions</span>
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
                        {isSyncing ? 'Synchronizing...' : 'Request Sync'}
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
                      onClick={() => handleConnectClick(platform.id)}
                      disabled={!platform.available}
                    >
                      {platform.available ? 'Establish Connection' : 'Unsupported'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={showShopifyModal}
        onClose={() => setShowShopifyModal(false)}
        title="Connect Shopify Storefront"
        confirmText="Connect Store"
        onConfirm={handleShopifyConnectSubmit}
      >
        <form onSubmit={handleShopifyConnectSubmit}>
          <div className="shopify-form">
            <label className="shopify-form__label">Shopify Store Domain</label>
            <input
              type="text"
              className="shopify-form__input"
              value={shopifyDomain}
              onChange={(e) => setShopifyDomain(e.target.value)}
              placeholder="mystore.myshopify.com"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Integrations;