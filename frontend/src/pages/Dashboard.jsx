import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDashboardMetricsQuery } from '../features/dashboard/dashboardSlice';
import { useSyncIntegrationMutation } from '../features/integrations/integrationsSlice';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import RevenueChart from '../components/charts/RevenueChart';
import OrdersChart from '../components/charts/OrdersChart';
import ConversionChart from '../components/charts/ConversionChart';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetDashboardMetricsQuery();
  const [syncIntegration, { isLoading: isSyncing }] = useSyncIntegrationMutation();
  const [syncStatus, setSyncStatus] = useState('idle');

  const formatNumber = (num) => {
    if (num === 0) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatCurrency = (num) => {
    if (num === 0) return '₹0';
    return `₹${new Intl.NumberFormat('en-IN').format(num)}`;
  };

  const handleSync = async () => {
    try {
      setSyncStatus('queued');
      await syncIntegration({ platform: 'shopify' }).unwrap();
    } catch (error) {
      console.error('Synchronization failed:', error);
      setSyncStatus('failed');
    }
  };

  const metrics = [
    { 
      key: 'totalRevenue', 
      label: 'Gross Revenue', 
      value: data?.totalRevenue || 0,
      format: formatCurrency,
    },
    { 
      key: 'totalOrders', 
      label: 'Total Transactions', 
      value: data?.totalOrders || 0,
      format: formatNumber,
    },
    { 
      key: 'totalVisitors', 
      label: 'Session Visitors', 
      value: data?.totalVisitors || 0,
      format: formatNumber,
    },
    { 
      key: 'conversionRate', 
      label: 'Conversion Rate', 
      value: data?.conversionRate || 0,
      format: (val) => `${val.toFixed(2)}%`,
    },
  ];

  if (error) {
    return (
      <div className="dashboard">
        <h1 className="dashboard__title">System Dashboard</h1>
        <div className="dashboard__error">
          <p>Failed to retrieve operational metrics.</p>
          <button className="dashboard__retry" onClick={refetch}>
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  if (!data?.hasIntegrations) {
    return (
      <div className="dashboard">
        <h1 className="dashboard__title">System Dashboard</h1>
        <div className="dashboard__empty-state">
          <EmptyState
            title="No Integrations Active"
            description="Establish a platform connection to retrieve operational metrics."
            action={true}
            actionLabel="Configure Integrations"
            onAction={() => navigate('/integrations')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">System Dashboard</h1>
        <div className="dashboard__controls">
          {data?.lastSynced && (
            <span className="dashboard__last-synced">
              Last Synchronization: {new Date(data.lastSynced).toLocaleString()}
              {data.hasPendingJobs && ' (Synchronizing...)'}
            </span>
          )}
          <button 
            className="dashboard__sync-btn"
            onClick={handleSync}
            disabled={isSyncing || data?.hasPendingJobs}
          >
            {data?.hasPendingJobs ? 'Synchronizing...' : 'Request Sync'}
          </button>
        </div>
      </div>
      
      <div className="dashboard__grid grid grid--4">
        {metrics.map((metric) => (
          <Card key={metric.key} accent>
            <div className="metric-card">
              <div className="metric-card__value">
                {isLoading ? '—' : metric.format(metric.value)}
              </div>
              <div className="metric-card__label">{metric.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard__section">
        <h2 className="dashboard__subtitle">Revenue Performance (30 Days)</h2>
        <Card>
          <RevenueChart 
            data={data?.revenueTrend || []} 
            isLoading={isLoading}
          />
        </Card>
      </div>

      <div className="dashboard__charts-grid">
        <div className="dashboard__section">
          <h2 className="dashboard__subtitle">Daily Transaction Volumes</h2>
          <Card>
            <OrdersChart 
              data={data?.ordersTrend || []} 
              isLoading={isLoading}
            />
          </Card>
        </div>
        <div className="dashboard__section">
          <h2 className="dashboard__subtitle">Session Conversion Rate</h2>
          <Card>
            <ConversionChart 
              data={data?.conversionTrend || []} 
              isLoading={isLoading}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;