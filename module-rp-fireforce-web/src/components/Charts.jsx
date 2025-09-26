import React from 'react';
import { TrendingUp, TrendingDown, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

// Simple line chart component
export const LineChart = ({ data, title, color = 'primary', height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorClasses = {
    primary: 'stroke-primary-500',
    success: 'stroke-success-500',
    warning: 'stroke-yellow-500',
    danger: 'stroke-red-500',
    info: 'stroke-blue-500'
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-900 mb-4">{title}</h3>
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
            className={colorClasses[color]}
          />
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="currentColor"
                className={colorClasses[color]}
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-surface-500 mt-2">
          {data.map((point, index) => (
            <span key={index}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Bar chart component
export const BarChart = ({ data, title, color = 'primary' }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500'
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-sm text-surface-600 text-right">{item.label}</div>
            <div className="flex-1 relative">
              <div className="bg-surface-100 rounded-full h-6 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
              <div className="absolute right-2 top-0 h-6 flex items-center">
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut chart component
export const DonutChart = ({ data, title, centerText = '' }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const colors = [
    'stroke-primary-500',
    'stroke-success-500', 
    'stroke-yellow-500',
    'stroke-red-500',
    'stroke-blue-500',
    'stroke-purple-500'
  ];

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-900 mb-4">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 42 42" className="transform -rotate-90">
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            {data.map((item, index) => {
              const percent = (item.value / total) * 100;
              const strokeDasharray = `${percent} ${100 - percent}`;
              const strokeDashoffset = -cumulativePercent;
              cumulativePercent += percent;
              
              return (
                <circle
                  key={index}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  strokeWidth="3"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className={colors[index % colors.length]}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-surface-900">{total}</div>
            <div className="text-xs text-surface-500">{centerText}</div>
          </div>
        </div>
        <div className="flex-1 ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full bg-${colors[index % colors.length].split('-')[1]}-500`}></div>
              <span className="text-sm text-surface-600">{item.label}</span>
              <span className="text-sm font-medium text-surface-900 ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Metric cards for KPIs
export const MetricCard = ({ title, value, change, changeType, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-yellow-600 bg-yellow-50',
    danger: 'text-red-600 bg-red-50',
    info: 'text-blue-600 bg-blue-50'
  };

  const TrendIcon = changeType === 'increase' ? TrendingUp : TrendingDown;
  const trendColor = changeType === 'increase' ? 'text-success-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-surface-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-surface-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm font-medium ${trendColor} ml-1`}>
                {change}
              </span>
              <span className="text-surface-500 text-sm ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Area chart component for trend visualization
export const AreaChart = ({ data, title, color = 'primary' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 80; // Leave 20% padding
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  const colorClasses = {
    primary: { stroke: 'stroke-primary-500', fill: 'fill-primary-100' },
    success: { stroke: 'stroke-success-500', fill: 'fill-success-100' },
    warning: { stroke: 'stroke-yellow-500', fill: 'fill-yellow-100' },
    danger: { stroke: 'stroke-red-500', fill: 'fill-red-100' },
    info: { stroke: 'stroke-blue-500', fill: 'fill-blue-100' }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-surface-900">{data[data.length - 1]?.value}</div>
          <div className="text-sm text-surface-500">Current</div>
        </div>
      </div>
      <div className="relative h-32">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
          {/* Area fill */}
          <polygon
            points={areaPoints}
            className={colorClasses[color].fill}
            fillOpacity="0.3"
          />
          {/* Line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={points}
            className={colorClasses[color].stroke}
          />
          {/* Points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="currentColor"
                className={colorClasses[color].stroke}
              />
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-surface-500 mt-2">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
};

// Compact service status grid
export const ServiceStatusGrid = ({ services, title }) => {
  const statusCounts = services.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-success-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'unknown': return 'bg-surface-300';
      default: return 'bg-surface-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-900 mb-4">{title}</h3>
      
      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
              <span className="text-sm font-medium text-surface-900 capitalize">{status}</span>
            </div>
            <span className="text-lg font-bold text-surface-900">{count}</span>
          </div>
        ))}
      </div>

      {/* Mini Grid */}
      <div className="grid grid-cols-12 gap-1">
        {services.slice(0, 48).map((service, index) => (
          <div
            key={index}
            className={`aspect-square rounded ${getStatusColor(service.status)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
            title={`${service.name}: ${service.status}`}
          />
        ))}
      </div>
      
      <div className="text-xs text-surface-500 mt-2 text-center">
        {services.length} services monitored
      </div>
    </div>
  );
};
