import React, { useState } from 'react';
import { X, User, Phone, Mail, Clock, Plus, Trash2, Edit2 } from 'lucide-react';

export default function ScheduleDayModal({ date, schedule, onClose, onSave, onDelete, teamMembers }) {
  const [isEditing, setIsEditing] = useState(!schedule?.assignment);
  const [selectedPrimary, setSelectedPrimary] = useState(schedule?.assignment?.primary?.id || '');
  const [selectedBackup, setSelectedBackup] = useState(schedule?.assignment?.backup?.id || '');
  const [selectedEscalation, setSelectedEscalation] = useState(
    schedule?.assignment?.escalation?.[0]?.id || ''
  );

  const formatDate = (dateObj) => {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = new Date().toDateString() === date.toDateString();
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSave = () => {
    const primary = teamMembers.find(m => m.id === selectedPrimary);
    const backup = teamMembers.find(m => m.id === selectedBackup);
    const escalation = teamMembers.find(m => m.id === selectedEscalation);

    onSave({
      date: date.toISOString().split('T')[0],
      assignment: {
        primary: primary || null,
        backup: backup || null,
        escalation: escalation ? [escalation] : []
      }
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this schedule assignment?')) {
      onDelete(date.toISOString().split('T')[0]);
      onClose();
    }
  };

  const PersonCard = ({ person, role, roleColor }) => {
    if (!person) return null;

    const colorClasses = {
      primary: 'bg-green-50 border-green-200',
      backup: 'bg-blue-50 border-blue-200',
      escalation: 'bg-orange-50 border-orange-200'
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${colorClasses[role]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
              {person.firstName?.charAt(0)}{person.lastName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">
                {person.firstName} {person.lastName}
              </p>
              <p className="text-sm text-gray-600 font-semibold capitalize">{role}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {person.phoneNumber && (
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Phone className="w-4 h-4 text-gray-700" />
              <span className="font-semibold">{person.phoneNumber}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-900">
            <Mail className="w-4 h-4 text-gray-700" />
            <span className="font-semibold">{person.email}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {formatDate(date)}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                {isToday && (
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    TODAY
                  </span>
                )}
                {isPast && (
                  <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                    PAST
                  </span>
                )}
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {schedule?.assignment ? 'Scheduled' : 'No assignment'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* View Mode */}
          {!isEditing && schedule?.assignment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Current Assignment</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              {schedule.assignment.primary && (
                <PersonCard 
                  person={schedule.assignment.primary} 
                  role="primary"
                  roleColor="from-green-500 to-green-600"
                />
              )}

              {schedule.assignment.backup && (
                <PersonCard 
                  person={schedule.assignment.backup} 
                  role="backup"
                  roleColor="from-blue-500 to-blue-600"
                />
              )}

              {schedule.assignment.escalation && schedule.assignment.escalation.length > 0 && (
                <PersonCard 
                  person={schedule.assignment.escalation[0]} 
                  role="escalation"
                  roleColor="from-orange-500 to-orange-600"
                />
              )}
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {schedule?.assignment ? 'Edit Assignment' : 'Create Assignment'}
                </h3>
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Select team members for each role
                  </span>
                </div>
              </div>

              {/* Primary Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Primary On-Call <span className="text-green-600">●</span>
                </label>
                <select
                  value={selectedPrimary}
                  onChange={(e) => setSelectedPrimary(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-semibold text-gray-900"
                >
                  <option value="">Select primary on-call person...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Backup Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Backup On-Call <span className="text-blue-600">●</span>
                </label>
                <select
                  value={selectedBackup}
                  onChange={(e) => setSelectedBackup(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-gray-900"
                >
                  <option value="">Select backup on-call person...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Escalation Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Escalation Contact <span className="text-orange-600">●</span>
                </label>
                <select
                  value={selectedEscalation}
                  onChange={(e) => setSelectedEscalation(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-semibold text-gray-900"
                >
                  <option value="">Select escalation contact...</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> At least one person (Primary) is recommended for each day. 
                  Backup and Escalation are optional but help ensure coverage.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (schedule?.assignment) {
                      setIsEditing(false);
                    } else {
                      onClose();
                    }
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!selectedPrimary}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-bold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  {schedule?.assignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
