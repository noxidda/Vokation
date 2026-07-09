import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OrdersChart = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="chart-placeholder" style={{ height: '200px' }}>
        <div className="chart-placeholder__content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-placeholder" style={{ height: '200px' }}>
        <div className="chart-placeholder__content">
          <p>No orders data available</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Orders',
        data: data.map(d => d.orders),
        backgroundColor: '#9B7EB2',
        borderColor: '#9B7EB2',
        borderWidth: 1,
        borderRadius: 0,
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
            size: 10,
          },
          color: '#a197b4',
          maxTicksLimit: 10,
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
            size: 10,
          },
          color: '#a197b4',
          stepSize: 1,
        },
        border: {
          display: true,
          color: '#E2D9F3',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default OrdersChart;