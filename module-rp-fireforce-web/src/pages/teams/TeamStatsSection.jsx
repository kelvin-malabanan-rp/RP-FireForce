import React from 'react';
import { 
  Users, 
  Shield, 
  Timer, 
  Target, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

const TeamStatsSection = ({ stats, isLoading = false }) => {
  const getIconComponent = (iconName) => {
    const iconMap = {
      Users,
      Shield,
      Timer,
      Target,
      Activity
    };
    return iconMap[iconName] || Users;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 mr-1" />;
    if (trend === 'down') return <TrendingUp className="w-3 h-3 mr-1 rotate-180" />;
    return <Activity className="w-3 h-3 mr-1" />;
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'bg-green-100 text-green-800';
    if (trend === 'down') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = getIconComponent(stat.icon);
        
        return (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(stat.trend)}`}>
                {getTrendIcon(stat.trend)}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamStatsSection;
