import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * EmptyState - A reusable component for displaying empty states
 * @param {string} icon - Icon component to display (default: AlertTriangle)
 * @param {string} title - Main heading text
 * @param {string} description - Supporting description text
 * @param {ReactNode} action - Optional action button or element
 * @param {string} iconColor - Color class for icon (default: 'text-gray-400')
 */
const EmptyState = ({ 
  icon: Icon = AlertTriangle,
  title = 'No data found',
  description = 'There is no data to display at this time',
  action = null,
  iconColor = 'text-gray-400'
}) => {
  return (
    <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
      <div className={`w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
