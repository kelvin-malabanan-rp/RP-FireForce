import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const ScheduleCalendar = ({ scheduleData, currentDate, onNavigateMonth, onDayClick }) => {
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const time = new Date(`2000-01-01T${timeStr}`);
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch {
      return timeStr;
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getScheduleForDate = (date) => {
    if (!scheduleData || !date) return null;
    
    const dateString = date.toISOString().split('T')[0];
    return scheduleData.find(schedule => schedule.date === dateString);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Schedule Calendar</h2>
          {(!scheduleData || scheduleData.length === 0) && (
            <p className="text-sm text-gray-500 mt-1">
              Select a team to view schedule assignments
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onNavigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={() => onNavigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Header - Day Names */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={day} className={`
            p-2 text-center text-xs font-bold uppercase tracking-wide
            ${index === 0 || index === 6 ? 'text-gray-500' : 'text-gray-700'}
          `}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Body */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square min-h-[100px]"></div>;
          }

          const schedule = getScheduleForDate(day);
          const isToday = new Date().toDateString() === day.toDateString();
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={index}
              onClick={() => onDayClick && onDayClick(day, schedule)}
              className={`
                aspect-square min-h-[100px] p-2 border rounded-lg transition-all
                cursor-pointer hover:shadow-lg transform hover:scale-105
                ${isToday 
                  ? 'bg-blue-50 border-blue-500 border-2' 
                  : isWeekend 
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              {/* Date Number */}
              <div className={`
                text-sm font-semibold mb-2 flex items-center justify-between
                ${isToday ? 'text-blue-600' : isWeekend ? 'text-gray-500' : 'text-gray-900'}
              `}>
                <span>{day.getDate()}</span>
                {!schedule && (
                  <Plus className="w-3 h-3 text-gray-400" />
                )}
              </div>
              
              {/* Schedule Assignments */}
              {schedule && schedule.assignment && (
                <div className="space-y-1">
                  {schedule.assignment.primary && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold truncate border border-green-200">
                      {schedule.assignment.primary.firstName}
                    </div>
                  )}
                  {schedule.assignment.backup && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold truncate border border-blue-200">
                      {schedule.assignment.backup.firstName}
                    </div>
                  )}
                  {schedule.assignment.escalation && schedule.assignment.escalation.length > 0 && (
                    <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-bold truncate border border-orange-200">
                      {schedule.assignment.escalation[0].firstName}
                    </div>
                  )}
                </div>
              )}

              {/* No Schedule Indicator */}
              {(!schedule || !schedule.assignment) && (
                <div className="text-xs text-gray-400 font-semibold">
                  Click to add
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-700">Primary</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-gray-700">Backup</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span className="text-gray-700">Escalation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
            <span className="text-gray-700">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
