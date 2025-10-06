import React from 'react';
import { Phone, Mail, MoreHorizontal } from 'lucide-react';

export default function OnCallMember({ member }) {
  const getAvatarGradient = (index) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-cyan-500 to-cyan-600',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="group flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200">
      <div className="relative">
        <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarGradient(0)} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200`}>
          <span className="text-base font-bold text-white">{member.avatar}</span>
        </div>
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
          member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
        }`}>
          {member.status === 'active' && (
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate text-sm group-hover:text-blue-600 transition-colors">
          {member.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-500 truncate">{member.team}</p>
          <span className="text-gray-300">•</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            member.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {member.role}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Phone className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Mail className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
