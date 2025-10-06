import React from 'react';
import { Zap, Bell, Shield, Activity, Server, Database } from 'lucide-react';

export default function SystemStatus() {
  const statusItems = [
    { label: 'API Response', value: '45ms', icon: Zap, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Alert System', value: 'Active', icon: Bell, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Security', value: 'Secured', icon: Shield, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Server Load', value: '23%', icon: Server, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Database', value: 'Online', icon: Database, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Uptime', value: '99.9%', icon: Activity, color: 'text-green-600', bgColor: 'bg-green-50' }
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">System Status</h3>
          <p className="text-xs text-gray-500 mt-0.5">Live monitoring</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping absolute"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-xs text-green-700 font-semibold">All Systems Operational</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {statusItems.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <div 
              key={idx} 
              className="group p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-gradient-to-br from-white to-gray-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`${item.bgColor} p-1.5 rounded-lg group-hover:scale-110 transition-transform`}>
                  <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-600">{item.label}</span>
              </div>
              <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
            </div>
          );
        })}
      </div>

      {/* Performance Bar */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600">Overall Performance</span>
          <span className="text-sm font-bold text-green-600">98%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
            style={{ width: '98%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
