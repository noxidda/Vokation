import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RevenueChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="chart-placeholder" style={{ height: '300px' }}>
        <div className="chart-placeholder__content">
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder" style={{ height: '300px' }}>
        <div className="chart-placeholder__content">
          <p>Connect Shopify to see revenue trends</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(d => d.revenue),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ec4899',
        pointBorderColor: '#ffffff',
        tension: 0.2,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0d0917',
        titleColor: '#ffffff',
        bodyColor: '#e2d9f3',
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 6,
        padding: 12,
        titleFont: {
          family: 'Raleway',
          weight: '600',
          size: 12,
        },
        bodyFont: {
          family: 'Raleway',
          weight: '400',
          size: 12,
        },
        callbacks: {
          label: function(context) {
            return `₹${context.parsed.y.toLocaleString('en-IN')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Raleway',
            weight: '400',
            size: 11,
          },
          color: '#a197b4',
          maxTicksLimit: 15,
        },
        border: {
          display: true,
          color: 'rgba(139, 92, 246, 0.15)',
        },
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(139, 92, 246, 0.08)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'Raleway',
            weight: '400',
            size: 11,
          },
          color: '#a197b4',
          callback: function(value) {
            return `₹${value.toLocaleString('en-IN')}`;
          },
        },
        border: {
          display: true,
          color: 'rgba(139, 92, 246, 0.15)',
        },
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RevenueChart;