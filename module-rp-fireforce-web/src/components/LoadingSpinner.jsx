import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner - A reusable loading spinner component
 * @param {string} size - Size of spinner: 'sm', 'md', 'lg', 'xl'
 * @param {string} color - Color class for spinner (default: 'text-blue-600')
 * @param {string} text - Optional loading text to display
 * @param {boolean} fullScreen - If true, centers spinner in full viewport
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'text-blue-600', 
  text = '', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const spinner = (
    <div className={`flex items-center ${fullScreen ? 'justify-center' : ''}`}>
      <Loader2 className={`${sizeClasses[size]} ${color} animate-spin`} />
      {text && (
        <span className={`ml-3 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'} font-medium text-gray-600`}>
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
