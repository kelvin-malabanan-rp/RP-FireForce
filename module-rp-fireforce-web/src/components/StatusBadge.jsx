import React from 'react';
import { AlertCircle, Eye, CheckCircle, ArrowUp, AlertTriangle } from 'lucide-react';

const StatusBadge = ({ status, size = 'md' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-900 border-red-200';
      case 'Investigating': return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Resolved': return 'bg-green-100 text-green-900 border-green-200';
      case 'Escalated': return 'bg-purple-100 text-purple-900 border-purple-200';
      default: return 'bg-gray-100 text-gray-900 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    
    switch (status) {
      case 'Open': return <AlertCircle className={iconSize} />;
      case 'Investigating': return <Eye className={iconSize} />;
      case 'Resolved': return <CheckCircle className={iconSize} />;
      case 'Escalated': return <ArrowUp className={iconSize} />;
      default: return <AlertTriangle className={iconSize} />;
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-lg font-semibold border ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{status}</span>
    </span>
  );
};

export default StatusBadge;
