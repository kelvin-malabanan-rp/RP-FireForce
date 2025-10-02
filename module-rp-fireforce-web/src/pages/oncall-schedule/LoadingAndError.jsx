import React from 'react';
import { AlertTriangle } from 'lucide-react';

const LoadingState = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-lg font-medium text-gray-600">{message}</span>
      </div>
    </div>
  );
};

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="text-lg font-semibold text-red-900">Error Loading Data</h3>
          <p className="text-red-700">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { LoadingState, ErrorState };
