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
        backgroundColor: 'rgba(236, 72, 153, 0.7)',
        borderColor: '#ec4899',
        borderWidth: 1,
        borderRadius: 4,
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
            size: 10,
          },
          color: '#a197b4',
          maxTicksLimit: 10,
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
            size: 10,
          },
          color: '#a197b4',
          stepSize: 1,
        },
        border: {
          display: true,
          color: 'rgba(139, 92, 246, 0.15)',
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