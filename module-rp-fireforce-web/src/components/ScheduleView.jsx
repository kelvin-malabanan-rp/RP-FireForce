import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  CalendarDays,
  RefreshCw,
  Filter,
  Download,
  Settings
} from 'lucide-react';

const ScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, list
  const [selectedSchedule, setSelectedSchedule] = useState('all');

  // Mock schedule data
  const schedules = [
    {
      id: 'platform-primary',
      name: 'Platform Primary',
      team: 'Platform Engineering',
      type: 'primary',
      color: 'bg-blue-500',
      shifts: [
        {
          id: 1,
          person: 'Sarah Chen',
          avatar: '👩‍💻',
          start: new Date(2024, 0, 15, 9, 0),
          end: new Date(2024, 0, 22, 9, 0),
          type: 'regular'
        },
        {
          id: 2,
          person: 'Mike Rodriguez',
          avatar: '👨‍💻',
          start: new Date(2024, 0, 22, 9, 0),
          end: new Date(2024, 0, 29, 9, 0),
          type: 'regular'
        }
      ]
    },
    {
      id: 'platform-secondary',
      name: 'Platform Secondary',
      team: 'Platform Engineering',
      type: 'secondary',
      color: 'bg-green-500',
      shifts: [
        {
          id: 3,
          person: 'Mike Rodriguez',
          avatar: '👨‍💻',
          start: new Date(2024, 0, 15, 9, 0),
          end: new Date(2024, 0, 22, 9, 0),
          type: 'regular'
        },
        {
          id: 4,
          person: 'David Park',
          avatar: '👨‍💼',
          start: new Date(2024, 0, 22, 9, 0),
          end: new Date(2024, 0, 29, 9, 0),
          type: 'regular'
        }
      ]
    },
    {
      id: 'frontend-primary',
      name: 'Frontend Primary',
      team: 'Frontend Team',
      type: 'primary',
      color: 'bg-purple-500',
      shifts: [
        {
          id: 5,
          person: 'Alex Kim',
          avatar: '👨‍🎨',
          start: new Date(2024, 0, 15, 9, 0),
          end: new Date(2024, 0, 22, 9, 0),
          type: 'regular'
        },
        {
          id: 6,
          person: 'Lisa Wang',
          avatar: '👩‍🎨',
          start: new Date(2024, 0, 22, 9, 0),
          end: new Date(2024, 0, 29, 9, 0),
          type: 'regular'
        }
      ]
    }
  ];

  const maintenanceWindows = [
    {
      id: 1,
      title: 'Database Maintenance',
      description: 'Scheduled database optimization and backup',
      start: new Date(2024, 0, 20, 2, 0),
      end: new Date(2024, 0, 20, 6, 0),
      type: 'maintenance',
      impact: 'medium'
    },
    {
      id: 2,
      title: 'Load Balancer Update',
      description: 'Security patches and configuration updates',
      start: new Date(2024, 0, 25, 1, 0),
      end: new Date(2024, 0, 25, 3, 0),
      type: 'maintenance',
      impact: 'low'
    }
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const isDateInShift = (date, shift) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return shift.start <= dayEnd && shift.end >= dayStart;
  };

  const getShiftsForDate = (date) => {
    const shifts = [];
    schedules.forEach(schedule => {
      schedule.shifts.forEach(shift => {
        if (isDateInShift(date, shift)) {
          shifts.push({ ...shift, schedule: schedule });
        }
      });
    });
    return shifts;
  };

  const MonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-surface-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const shifts = getShiftsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div 
          key={day} 
          className={`h-24 border border-surface-200 p-1 ${isToday ? 'bg-primary-50 border-primary-200' : 'bg-white'}`}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-primary-600' : 'text-surface-900'} mb-1`}>
            {day}
          </div>
          <div className="space-y-1">
            {shifts.slice(0, 2).map((shift, index) => (
              <div 
                key={index}
                className={`text-xs px-2 py-1 rounded text-white truncate ${shift.schedule.color}`}
                title={`${shift.person} - ${shift.schedule.name}`}
              >
                {shift.person}
              </div>
            ))}
            {shifts.length > 2 && (
              <div className="text-xs text-surface-500">+{shifts.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-surface-200">
        <div className="grid grid-cols-7 gap-0 border-b border-surface-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 text-center font-medium text-surface-600 border-r border-surface-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {days}
        </div>
      </div>
    );
  };

  const ListView = () => {
    const allShifts = schedules.flatMap(schedule => 
      schedule.shifts.map(shift => ({ ...shift, schedule }))
    ).sort((a, b) => a.start - b.start);

    return (
      <div className="space-y-4">
        {allShifts.map((shift) => (
          <div key={`${shift.schedule.id}-${shift.id}`} className="bg-white rounded-xl border border-surface-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{shift.avatar}</div>
                <div>
                  <h3 className="font-semibold text-surface-900">{shift.person}</h3>
                  <p className="text-surface-600 text-sm">{shift.schedule.name} - {shift.schedule.team}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-surface-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{shift.start.toLocaleDateString()} - {shift.end.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(shift.start)} - {formatTime(shift.end)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  shift.schedule.type === 'primary' 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {shift.schedule.type}
                </span>
                <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-surface-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-surface-900">Schedule Management</h1>
          <p className="text-surface-600 mt-1">On-call rotations and maintenance windows</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            className="border border-surface-300 rounded-lg px-3 py-2 text-sm"
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
          >
            <option value="all">All Schedules</option>
            <option value="platform">Platform Engineering</option>
            <option value="frontend">Frontend Team</option>
            <option value="backend">Backend Services</option>
          </select>
          <button className="border border-surface-300 text-surface-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-surface-600" />
          </button>
          <h2 className="text-xl font-semibold text-surface-900 min-w-[200px] text-center">
            {formatDate(currentDate)}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-surface-600" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <div className="border border-surface-300 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                viewMode === 'month' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-surface-600 hover:text-surface-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Legend */}
      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <div className="flex items-center space-x-6">
          <h3 className="font-medium text-surface-900">Schedule Types:</h3>
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${schedule.color}`}></div>
              <span className="text-sm text-surface-600">{schedule.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      <div>
        {viewMode === 'month' && <MonthView />}
        {viewMode === 'list' && <ListView />}
      </div>

      {/* Maintenance Windows */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-surface-900 flex items-center space-x-2">
            <Settings className="w-6 h-6" />
            <span>Upcoming Maintenance Windows</span>
          </h3>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Schedule Maintenance</span>
          </button>
        </div>
        <div className="space-y-3">
          {maintenanceWindows.map((window) => (
            <div key={window.id} className="border border-surface-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-surface-900">{window.title}</h4>
                  <p className="text-sm text-surface-600 mt-1">{window.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-surface-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{window.start.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(window.start)} - {formatTime(window.end)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    window.impact === 'high' 
                      ? 'bg-red-100 text-red-700'
                      : window.impact === 'medium'
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {window.impact} impact
                  </span>
                  <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleView;
