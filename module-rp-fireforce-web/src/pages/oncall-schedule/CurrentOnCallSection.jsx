import React, { useState } from 'react';
import { Clock, Phone, Mail, MessageSquare, Users, Bell } from 'lucide-react';
import SendAlertModal from '../../components/SendAlertModal';

const CurrentOnCallCard = ({ person, role, color }) => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'primary':
        return 'bg-green-100 text-green-900';
      case 'backup':
        return 'bg-blue-100 text-blue-900';
      case 'escalation':
        return 'bg-orange-100 text-orange-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const getAvatarColor = (role) => {
    switch (role.toLowerCase()) {
      case 'primary':
        return 'bg-blue-600';
      case 'backup':
        return 'bg-purple-600';
      case 'escalation':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusColor = (role) => {
    switch (role.toLowerCase()) {
      case 'primary':
        return 'bg-green-500 animate-pulse';
      case 'backup':
        return 'bg-blue-500';
      case 'escalation':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (!person) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(role)}`}>
          {role}
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor(role)}`}></div>
      </div>
      
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAvatarColor(role)}`}>
          <span className="text-white font-bold">
            {getInitials(person.firstName, person.lastName)}
          </span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900">
            {person.firstName} {person.lastName}
          </h3>
          <p className="text-sm text-gray-900 font-semibold">{role} On-Call</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        {person.phoneNumber && (
          <div className="flex items-center text-sm text-gray-900 font-semibold">
            <Phone className="w-4 h-4 mr-2 text-gray-900" />
            {person.phoneNumber}
          </div>
        )}
        <div className="flex items-center text-sm text-gray-900 font-semibold">
          <Mail className="w-4 h-4 mr-2 text-gray-900" />
          {person.email}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold shadow-sm hover:shadow-md">
          <Phone className="w-4 h-4 mr-1" />
          Call
        </button>
        <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm hover:shadow-md">
          <MessageSquare className="w-4 h-4 mr-1" />
          Message
        </button>
        <button 
          onClick={() => setShowAlertModal(true)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all text-sm font-semibold shadow-md hover:shadow-lg"
        >
          <Bell className="w-4 h-4 mr-1" />
          Alert
        </button>
      </div>

      {/* Send Alert Modal */}
      {showAlertModal && (
        <SendAlertModal
          recipient={person}
          onClose={() => setShowAlertModal(false)}
          onSend={(result) => {
            console.log('Alert sent:', result);
          }}
        />
      )}
    </div>
  );
};

const CurrentOnCallSection = ({ currentOnCall, startTime, endTime }) => {
  if (!currentOnCall) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="col-span-3 text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No On-Call Data</h3>
          <p className="text-gray-700 font-medium">Select a team to view current on-call assignments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Schedule Period Info */}
      {(startTime || endTime) && (
        <div className="col-span-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center text-sm text-blue-900">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-bold">
                Current Schedule: {startTime && new Date(startTime).toLocaleDateString()} - {endTime && new Date(endTime).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Primary On-Call */}
      {currentOnCall.primary && (
        <CurrentOnCallCard 
          person={currentOnCall.primary} 
          role="Primary"
        />
      )}

      {/* Backup On-Call */}
      {currentOnCall.backup && (
        <CurrentOnCallCard 
          person={currentOnCall.backup} 
          role="Backup"
        />
      )}

      {/* Escalation */}
      {currentOnCall.escalation && currentOnCall.escalation.length > 0 && (
        <CurrentOnCallCard 
          person={currentOnCall.escalation[0]} 
          role="Escalation"
        />
      )}
    </div>
  );
};

export default CurrentOnCallSection;
