import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGetSubscriptionStatusQuery, useCreateOrderMutation } from '../features/payment/paymentSlice';
import NotificationToast from '../components/ui/NotificationToast';
import './Pricing.css';

const Pricing = () => {
  const { user } = useAuth();
  const { data: subscription, refetch } = useGetSubscriptionStatusQuery();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [toast, setToast] = useState(null);

  const features = [
    { name: 'Platform Connections', free: '1', pro: 'Unlimited' },
    { name: 'Sync Frequency', free: 'Manual', pro: 'Auto hourly' },
    { name: 'Team Members', free: '2', pro: 'Unlimited' },
    { name: 'Data Retention', free: '30 days', pro: '12 months' },
    { name: 'CSV Export', free: 'No', pro: 'Yes' },
    { name: 'Email Support', free: 'Community', pro: 'Priority' },
  ];

  const handleUpgrade = async () => {
    try {
      const result = await createOrder({ plan: 'pro' }).unwrap();
      
      // Load Razorpay checkout
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: result.keyId,
          amount: result.amount,
          currency: 'INR',
          name: 'Vokation',
          description: 'Pro Plan Subscription',
          order_id: result.orderId,
          handler: function(response) {
            // Verify payment on backend
            verifyPayment(response);
          },
          prefill: {
            name: `${user?.firstName || ''} ${user?.lastName || ''}`,
            email: user?.emailAddresses?.[0]?.emailAddress || '',
          },
          theme: {
            color: '#8b5cf6',
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
        title: 'Payment Error',
        message: error.message || 'Failed to initiate payment',
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
          title: 'Upgrade Successful',
          message: 'Welcome to Vokation Pro!',
        });
        refetch();
        setTimeout(() => {
          window.location.href = '/dashboard?upgrade=success';
        }, 1500);
      } else {
        setToast({
          type: 'error',
          title: 'Verification Failed',
          message: data.message || 'Payment verification failed',
        });
      }
    } catch (error) {
      setToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to verify payment',
      });
    }
  };

  const isPro = subscription?.tier === 'pro';

  return (
    <div className="pricing">
      <div className="pricing__header">
        <h1 className="pricing__title">Plans & Pricing</h1>
        <p className="pricing__subtitle">Choose the right plan for your business</p>
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
            <h2 className="pricing__plan-name">Free</h2>
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
            {isPro ? 'Downgrade' : 'Current Plan'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`pricing__card ${isPro ? 'pricing__card--active' : 'pricing__card--highlight'}`}>
          {!isPro && (
            <div className="pricing__popular-badge">POPULAR</div>
          )}
          <div className="pricing__card-header">
            <h2 className="pricing__plan-name">Pro</h2>
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
            onClick={handleUpgrade}
            disabled={isPro || isLoading}
          >
            {isPro ? 'Current Plan' : isLoading ? 'Processing...' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="pricing__comparison">
        <h3 className="pricing__comparison-title">Feature Comparison</h3>
        <table className="pricing__table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th>Pro</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index}>
                <td>{feature.name}</td>
                <td className="pricing__table-free">{feature.free}</td>
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