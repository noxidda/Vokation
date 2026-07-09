import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGetSubscriptionStatusQuery, useCreateOrderMutation } from '../features/payment/paymentSlice';
import NotificationToast from '../components/ui/NotificationToast';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: subscription, refetch } = useGetSubscriptionStatusQuery();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [toast, setToast] = useState(null);

  const features = [
    { name: 'Platform Connections', free: '1 Active Endpoint', pro: 'Unlimited Endpoints' },
    { name: 'Sync Frequency', free: 'Manual Trigger', pro: 'Automated (Hourly)' },
    { name: 'Team Members', free: '2 Seat Limit', pro: 'Unlimited Seats' },
    { name: 'Data Retention', free: '30 Days Historical', pro: '365 Days Historical' },
    { name: 'CSV Export', free: 'Not Supported', pro: 'Supported' },
    { name: 'Customer Support', free: 'Self-Serve Portal', pro: 'Priority Service Level' },
  ];

  const handleUpgrade = async (plan) => {
    try {
      const result = await createOrder({ plan }).unwrap();
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: result.keyId,
          amount: result.amount,
          currency: 'INR',
          name: 'Vokation',
          description: plan === 'pro_annual' ? 'Premium Annual Service Agreement' : 'Premium Service Agreement',
          order_id: result.orderId,
          handler: function(response) {
            verifyPayment(response);
          },
          prefill: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`,
            email: user?.emailAddresses?.[0]?.emailAddress || '',
          },
          theme: {
            color: '#9B7EB2',
          },
          modal: {
            backdropclose: false,
          },
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      document.body.appendChild(script);
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Payment Initialization Failed',
        message: error.message || 'Unable to establish payment session.',
      });
    }
  };

  const verifyPayment = async (response) => {
    try {
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clerk-token')}`,
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      
      const data = await verifyResponse.json();
      
      if (data.success) {
        setToast({
          type: 'success',
          title: 'Upgrade Succeeded',
          message: 'Workspace has been upgraded to Premium tier.',
        });
        refetch();
        setTimeout(() => {
          navigate('/dashboard?upgrade=success');
        }, 1500);
      } else {
        setToast({
          type: 'error',
          title: 'Verification Failed',
          message: data.message || 'Signature verification failed.',
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to verify transaction signature.',
      });
    }
  };

  const isPro = subscription?.tier === 'pro';

  return (
    <div className="pricing">
      <button className="pricing__back-btn" onClick={() => navigate('/dashboard')}>
        Return to Dashboard
      </button>
      <div className="pricing__header">
        <h1 className="pricing__title">Subscription Services</h1>
        <p className="pricing__subtitle">Select the service agreement aligned with your organizational requirements.</p>
      </div>

      {toast && (
        <NotificationToast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      <div className="pricing__cards">
        {/* Free Plan */}
        <div className={`pricing__card ${isPro ? 'pricing__card--muted' : 'pricing__card--active'}`}>
          <div className="pricing__card-header">
            <h2 className="pricing__plan-name">Standard</h2>
            <div className="pricing__price">
              <span className="pricing__amount">₹0</span>
              <span className="pricing__period">/month</span>
            </div>
          </div>
          <ul className="pricing__features">
            {features.map((feature, index) => (
              <li key={index} className="pricing__feature">
                <span className="pricing__feature-name">{feature.name}</span>
                <span className="pricing__feature-value">{feature.free}</span>
              </li>
            ))}
          </ul>
          <button 
            className={`pricing__btn ${isPro ? 'pricing__btn--secondary' : 'pricing__btn--primary'}`}
            disabled={true}
          >
            {isPro ? 'Standard Tier' : 'Active Agreement'}
          </button>
        </div>

        {/* Pro Plan (Monthly) */}
        <div className={`pricing__card ${isPro ? 'pricing__card--active' : 'pricing__card--highlight'}`}>
          {!isPro && (
            <div className="pricing__popular-badge">RECOMMENDED</div>
          )}
          <div className="pricing__card-header">
            <h2 className="pricing__plan-name">Premium (Monthly)</h2>
            <div className="pricing__price">
              <span className="pricing__amount pricing__amount--pro">₹999</span>
              <span className="pricing__period">/month</span>
            </div>
          </div>
          <ul className="pricing__features">
            {features.map((feature, index) => (
              <li key={index} className="pricing__feature">
                <span className="pricing__feature-name">{feature.name}</span>
                <span className="pricing__feature-value pricing__feature-value--pro">
                  {feature.pro}
                </span>
              </li>
            ))}
          </ul>
          <button 
            className={`pricing__btn ${isPro ? 'pricing__btn--secondary' : 'pricing__btn--primary'}`}
            onClick={() => handleUpgrade('pro')}
            disabled={isPro || isLoading}
          >
            {isPro ? 'Active Agreement' : isLoading ? 'Processing Transaction...' : 'Establish Premium Agreement'}
          </button>
        </div>

        {/* Pro Plan (Annual) */}
        <div className={`pricing__card ${isPro ? 'pricing__card--active' : 'pricing__card--highlight'}`}>
          {!isPro && (
            <div className="pricing__popular-badge">BEST VALUE</div>
          )}
          <div className="pricing__card-header">
            <h2 className="pricing__plan-name">Premium (Annual)</h2>
            <div className="pricing__price">
              <span className="pricing__amount pricing__amount--pro">₹6,999</span>
              <span className="pricing__period">/year</span>
            </div>
          </div>
          <ul className="pricing__features">
            {features.map((feature, index) => (
              <li key={index} className="pricing__feature">
                <span className="pricing__feature-name">{feature.name}</span>
                <span className="pricing__feature-value pricing__feature-value--pro">
                  {feature.pro}
                </span>
              </li>
            ))}
          </ul>
          <button 
            className={`pricing__btn ${isPro ? 'pricing__btn--secondary' : 'pricing__btn--primary'}`}
            onClick={() => handleUpgrade('pro_annual')}
            disabled={isPro || isLoading}
          >
            {isPro ? 'Active Agreement' : isLoading ? 'Processing Transaction...' : 'Establish Annual Agreement'}
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="pricing__comparison">
        <h3 className="pricing__comparison-title">Operational Feature Comparison</h3>
        <table className="pricing__table">
          <thead>
            <tr>
              <th>Service Element</th>
              <th>Standard</th>
              <th>Premium (Monthly)</th>
              <th>Premium (Annual)</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index}>
                <td>{feature.name}</td>
                <td className="pricing__table-free">{feature.free}</td>
                <td className="pricing__table-pro">{feature.pro}</td>
                <td className="pricing__table-pro">{feature.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pricing;