import React from 'react';
import { Clock, User, ChevronRight, AlertCircle } from 'lucide-react';

export default function IncidentCard({ incident, onClick }) {
  const getBorderColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'border-l-red-500 hover:border-red-500 hover:bg-red-50/50';
      case 'high': return 'border-l-orange-500 hover:border-orange-500 hover:bg-orange-50/50';
      case 'medium': return 'border-l-yellow-500 hover:border-yellow-500 hover:bg-yellow-50/50';
      case 'low': return 'border-l-green-500 hover:border-green-500 hover:bg-green-50/50';
      default: return 'border-l-gray-400 hover:border-gray-400 hover:bg-gray-50';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500 text-white shadow-red-500/30';
      case 'high': return 'bg-orange-500 text-white shadow-orange-500/30';
      case 'medium': return 'bg-yellow-500 text-white shadow-yellow-500/30';
      case 'low': return 'bg-green-500 text-white shadow-green-500/30';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-700 border-red-200';
      case 'Investigating': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative border-l-4 border border-gray-200 ${getBorderColor(incident.severity)} rounded-lg p-5 cursor-pointer transition-all duration-300 hover:shadow-md`}
    >
      {/* Hover indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      <div className="pr-8">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {incident.severity?.toLowerCase() === 'critical' && (
              <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
            )}
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-base">
              {incident.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getSeverityColor(incident.severity)}`}>
            {incident.severity}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(incident.status)}`}>
            {incident.status}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {incident.description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            {incident.time}
          </span>
          <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
            <User className="w-3.5 h-3.5" />
            {incident.assignee || 'Unassigned'}
          </span>
        </div>
      </div>
    </div>
  );
}
