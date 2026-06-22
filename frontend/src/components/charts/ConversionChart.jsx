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

const ConversionChart = ({ data, isLoading }) => {
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
          <p>No conversion data available</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Conversion Rate',
        data: data.map(d => d.rate),
        borderColor: '#ec4899',
        backgroundColor: '#ec4899',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.2,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: 'Visitors',
        data: data.map(d => d.visitors),
        borderColor: '#8b5cf6',
        backgroundColor: '#8b5cf6',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.2,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Raleway',
            weight: '500',
            size: 11,
          },
          color: '#e2d9f3',
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
        },
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
        type: 'linear',
        display: true,
        position: 'left',
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
          callback: function(value) {
            return value + '%';
          },
        },
        border: {
          display: true,
          color: 'rgba(139, 92, 246, 0.15)',
        },
        beginAtZero: true,
      },
      y1: {
        type: 'linear',
        display: false,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ height: '200px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ConversionChart;