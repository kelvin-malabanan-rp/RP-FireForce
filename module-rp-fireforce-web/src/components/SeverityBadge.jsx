import React from 'react';

const SeverityBadge = ({ severity, size = 'md' }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      case 'Low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-lg font-bold ${getSeverityColor(severity)}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
