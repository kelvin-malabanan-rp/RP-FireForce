import React from 'react';
import { Plus, RefreshCw, Download } from 'lucide-react';

export default function DashboardHeader({ onRefresh, isRefreshing }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 text-base">
          Real-time emergency response monitoring and analytics
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 font-medium flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        
        <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 font-medium flex items-center gap-2 shadow-sm">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
        
        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all duration-200 font-semibold flex items-center gap-2 shadow-md">
          <Plus className="w-4 h-4" />
          New Incident
        </button>
      </div>
    </div>
  );
}
