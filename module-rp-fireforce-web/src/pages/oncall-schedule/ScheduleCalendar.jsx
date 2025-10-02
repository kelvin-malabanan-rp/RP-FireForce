import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ScheduleCalendar = ({ scheduleData, currentDate, onNavigateMonth }) => {
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
    <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Schedule Calendar</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onNavigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={() => onNavigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 bg-gray-50 rounded-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Body */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square min-h-[120px]"></div>;
          }

          const schedule = getScheduleForDate(day);
          const isToday = new Date().toDateString() === day.toDateString();
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={index}
              className={`
                aspect-square min-h-[120px] p-3 border-2 rounded-xl transition-all duration-200 hover:shadow-md
                ${isToday 
                  ? 'bg-blue-50 border-blue-300 shadow-md' 
                  : isWeekend 
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {/* Date Number */}
              <div className={`
                text-sm font-bold mb-2 flex items-center justify-between
                ${isToday ? 'text-blue-600' : 'text-gray-900'}
              `}>
                <span>{day.getDate()}</span>
                {isToday && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* Schedule Assignments */}
              {schedule && schedule.assignment && (
                <div className="space-y-1">
                  {schedule.assignment.primary && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md font-medium truncate min-w-0 flex-1">
                        {schedule.assignment.primary.firstName || 'Primary'}
                      </div>
                    </div>
                  )}
                  {schedule.assignment.backup && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium truncate min-w-0 flex-1">
                        {schedule.assignment.backup.firstName || 'Backup'}
                      </div>
                    </div>
                  )}
                  {schedule.assignment.escalation && schedule.assignment.escalation.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                      <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-md font-medium truncate min-w-0 flex-1">
                        {schedule.assignment.escalation[0].firstName || 'Escalation'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No Schedule Indicator */}
              {(!schedule || !schedule.assignment) && (
                <div className="text-xs text-gray-400 italic">
                  No schedule
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 font-medium">Primary</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 font-medium">Backup</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600 font-medium">Escalation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse"></div>
            <span className="text-gray-600 font-medium">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
