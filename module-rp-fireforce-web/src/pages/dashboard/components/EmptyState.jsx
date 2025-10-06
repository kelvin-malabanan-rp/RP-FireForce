import React from 'react';
import { CheckCircle, Users, Sparkles } from 'lucide-react';

export default function EmptyState({ type = 'incidents' }) {
  if (type === 'incidents') {
    return (
      <div className="relative text-center py-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 right-4">
          <Sparkles className="w-6 h-6 text-green-400 animate-pulse" />
        </div>
        <div className="absolute bottom-4 left-4">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-900 font-bold text-xl mb-2">All Clear! 🎉</p>
          <p className="text-gray-600 text-sm max-w-xs mx-auto">No recent incidents to display. Your systems are running smoothly.</p>
        </div>
      </div>
    );
  }

  if (type === 'oncall') {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4 shadow-sm">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-900 font-semibold text-base mb-1">No Schedule Available</p>
        <p className="text-gray-600 text-sm">Team schedules will appear here</p>
      </div>
    );
  }

  return null;
}
