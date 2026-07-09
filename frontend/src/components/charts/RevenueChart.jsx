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
        borderColor: '#E2D9F3',
        backgroundColor: '#000000',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#9B7EB2',
        pointBorderColor: '#000000',
        tension: 0,
        fill: false,
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
        backgroundColor: '#000000',
        titleColor: '#E2D9F3',
        bodyColor: '#E2D9F3',
        borderColor: '#E2D9F3',
        borderWidth: 1,
        cornerRadius: 0,
        padding: 12,
        titleFont: {
          family: 'DM Sans',
          weight: '600',
          size: 12,
        },
        bodyFont: {
          family: 'DM Sans',
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
            family: 'DM Sans',
            weight: '400',
            size: 11,
          },
          color: '#a197b4',
          maxTicksLimit: 15,
        },
        border: {
          display: true,
          color: '#E2D9F3',
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'DM Sans',
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
          color: '#E2D9F3',
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