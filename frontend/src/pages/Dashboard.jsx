import React from 'react';
import { useGetDashboardMetricsQuery } from '../features/dashboard/dashboardSlice';
import Card from '../components/ui/Card';
import './Dashboard.css';

const Dashboard = () => {
  const { data, isLoading, error, refetch } = useGetDashboardMetricsQuery();

  const formatNumber = (num) => {
    if (num === 0) return '0';
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatCurrency = (num) => {
    if (num === 0) return '₹0';
    return `₹${new Intl.NumberFormat('en-IN').format(num)}`;
  };

  const metrics = [
    { 
      key: 'revenue', 
      label: 'Total Revenue', 
      value: data?.revenue || 0,
      format: formatCurrency,
    },
    { 
      key: 'orders', 
      label: 'Total Orders', 
      value: data?.orders || 0,
      format: formatNumber,
    },
    { 
      key: 'visitors', 
      label: 'Visitors', 
      value: data?.visitors || 0,
      format: formatNumber,
    },
    { 
      key: 'conversionRate', 
      label: 'Conversion Rate', 
      value: data?.conversionRate || 0,
      format: (val) => `${val}%`,
    },
  ];

  if (error) {
    return (
      <div className="dashboard">
        <h1 className="dashboard__title">Dashboard</h1>
        <div className="dashboard__error">
          <p>Failed to load dashboard metrics</p>
          <button className="dashboard__retry" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Dashboard</h1>
      
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
        <h2 className="dashboard__subtitle">Recent Activity</h2>
        <Card>
          <div className="dashboard__empty">
            <p>No recent activity</p>
          </div>
        </Card>
      </div>

      <div className="dashboard__section">
        <h2 className="dashboard__subtitle">Analytics</h2>
        <Card>
          <div className="dashboard__empty">
            <p>Chart coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;