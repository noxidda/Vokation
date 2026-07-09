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
        borderColor: '#9B7EB2',
        backgroundColor: '#9B7EB2',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: 'Visitors',
        data: data.map(d => d.visitors),
        borderColor: '#E2D9F3',
        backgroundColor: '#E2D9F3',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0,
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
            family: 'DM Sans',
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
        type: 'linear',
        display: true,
        position: 'left',
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
          callback: function(value) {
            return value + '%';
          },
        },
        border: {
          display: true,
          color: '#E2D9F3',
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