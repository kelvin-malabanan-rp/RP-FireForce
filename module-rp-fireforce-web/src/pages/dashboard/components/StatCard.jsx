import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color, bgColor, trend, trendValue }) {
  const getTrendIcon = () => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Minus;
  };
  
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 bg-green-50';
    if (trend === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };
  
  const TrendIcon = getTrendIcon();

  return (
    <div className="group relative bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`${bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          
          {trendValue && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor()}`}>
              <TrendIcon className="w-3 h-3" />
              {trendValue}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {value}
          </p>
        </div>
      </div>
      
      {/* Decorative corner element */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"></div>
    </div>
  );
}
