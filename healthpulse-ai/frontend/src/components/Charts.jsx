import React from 'react';
import { Line } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Charts({ data = [] }) {
  // Expected data structure:
  // Array of { date: 'YYYY-MM-DD', parameter_values: { Glucose: 110, Cholesterol: 240, Hemoglobin: 11.2 } }
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 h-64 flex items-center justify-center text-slate-400 text-xs">
        No comparative values available to plot chart.
      </div>
    );
  }

  // Sort chronological
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dates = sortedData.map(item => item.date);

  // Extract all unique parameter names
  const allParameters = new Set();
  sortedData.forEach(item => {
    if (item.parameter_values) {
      Object.keys(item.parameter_values).forEach(key => allParameters.add(key));
    }
  });

  // Color map
  const colorMap = {
    Glucose: {
      border: 'rgb(239, 68, 68)',
      bg: 'rgba(239, 68, 68, 0.1)'
    },
    Cholesterol: {
      border: 'rgb(59, 130, 246)',
      bg: 'rgba(59, 130, 246, 0.1)'
    },
    Hemoglobin: {
      border: 'rgb(124, 58, 237)',
      bg: 'rgba(124, 58, 237, 0.1)'
    }
  };

  const getColors = (paramName, index) => {
    if (colorMap[paramName]) return colorMap[paramName];
    // Fallback dynamic colors
    const hue = (index * 137.5) % 360; // Golden ratio spacing
    return {
      border: `hsl(${hue}, 70%, 50%)`,
      bg: `hsl(${hue}, 70%, 90%)`
    };
  };

  // Build datasets
  const datasets = Array.from(allParameters).map((paramName, idx) => {
    const colors = getColors(paramName, idx);
    const dataPoints = sortedData.map(item => {
      const val = item.parameter_values?.[paramName];
      return val !== undefined ? parseFloat(val) : null;
    });

    return {
      label: paramName,
      data: dataPoints,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderWidth: 3,
      tension: 0.35,
      pointBackgroundColor: colors.border,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      spanGaps: true
    };
  });

  const chartData = {
    labels: dates.map(d => {
      try {
        const dateObj = new Date(d);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
        return d;
      }
    }),
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            family: 'Outfit, sans-serif',
            size: 11,
            weight: 'semibold'
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: {
          family: 'Outfit, sans-serif',
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, sans-serif'
        },
        padding: 12,
        cornerRadius: 12,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: '#f1f5f9'
        },
        ticks: {
          font: {
            family: 'Inter, sans-serif',
            size: 10
          }
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[320px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
