import React from 'react';
import Card from '../components/ui/Card';
import './Integrations.css';

const Integrations = () => {
  const platforms = [
    { id: 'shopify', name: 'Shopify', icon: '🛍️', connected: false },
    { id: 'google_analytics', name: 'Google Analytics', icon: '📊', connected: false },
    { id: 'facebook_ads', name: 'Facebook Ads', icon: '📱', connected: false },
    { id: 'mailchimp', name: 'Mailchimp', icon: '📧', connected: false },
  ];

  return (
    <div className="integrations">
      <h1 className="integrations__title">Integrations</h1>
      <p className="integrations__subtitle">
        Connect your platforms to sync data
      </p>

      <div className="integrations__grid grid grid--2">
        {platforms.map((platform) => (
          <Card 
            key={platform.id} 
            accent={platform.connected}
            className={`integration-card ${platform.connected ? 'integration-card--connected' : 'integration-card--disconnected'}`}
          >
            <div className="integration-card__content">
              <div className="integration-card__header">
                <span className="integration-card__icon">{platform.icon}</span>
                <h3 className="integration-card__name">{platform.name}</h3>
              </div>
              <div className="integration-card__status">
                <span className={`integration-card__badge ${platform.connected ? 'integration-card__badge--connected' : 'integration-card__badge--disconnected'}`}>
                  {platform.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <button 
                className="integration-card__btn"
                disabled={!platform.connected}
              >
                {platform.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Integrations;