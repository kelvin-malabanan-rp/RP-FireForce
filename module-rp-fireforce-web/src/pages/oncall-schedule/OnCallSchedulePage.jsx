import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Bell,
  Settings,
  User,
  UserCheck,
  UserX,
  CalendarDays,
  Timer,
  Filter,
  Download
} from 'lucide-react';

const OnCallSchedulePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState('month'); // month, week, day
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Mock data for on-call schedules
  const teams = [
    { id: 'all', name: 'All Teams', color: 'gray' },
    { id: 'backend', name: 'Backend Team', color: 'blue' },
    { id: 'frontend', name: 'Frontend Team', color: 'green' },
    { id: 'devops', name: 'DevOps Team', color: 'purple' },
    { id: 'mobile', name: 'Mobile Team', color: 'orange' }
  ];

  const currentOnCall = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Primary',
      team: 'Backend Team',
      avatar: 'SC',
      phone: '+1 (555) 123-4567',
      email: 'sarah.chen@company.com',
      status: 'active',
      startTime: '2025-10-01 08:00',
      endTime: '2025-10-01 20:00',
      timezone: 'PST'
    },
    {
      id: 2,
      name: 'Mike Rodriguez',
      role: 'Secondary',
      team: 'DevOps Team',
      avatar: 'MR',
      phone: '+1 (555) 987-6543',
      email: 'mike.rodriguez@company.com',
      status: 'active',
      startTime: '2025-10-01 08:00',
      endTime: '2025-10-01 20:00',
      timezone: 'EST'
    },
    {
      id: 3,
      name: 'Emma Watson',
      role: 'Escalation',
      team: 'Frontend Team',
      avatar: 'EW',
      phone: '+1 (555) 456-7890',
      email: 'emma.watson@company.com',
      status: 'backup',
      startTime: '2025-10-01 20:00',
      endTime: '2025-10-02 08:00',
      timezone: 'PST'
    }
  ];

  const upcomingSchedule = [
    {
      id: 4,
      name: 'Alex Kumar',
      role: 'Primary',
      team: 'Backend Team',
      startDate: '2025-10-02',
      endDate: '2025-10-02',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 5,
      name: 'David Park',
      role: 'Secondary',
      team: 'Mobile Team',
      startDate: '2025-10-02',
      endDate: '2025-10-02',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 6,
      name: 'Lisa Chen',
      role: 'Primary',
      team: 'Frontend Team',
      startDate: '2025-10-03',
      endDate: '2025-10-03',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 7,
      name: 'James Wilson',
      role: 'Secondary',
      team: 'DevOps Team',
      startDate: '2025-10-03',
      endDate: '2025-10-03',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 8,
      name: 'Maria Garcia',
      role: 'Primary',
      team: 'Backend Team',
      startDate: '2025-10-04',
      endDate: '2025-10-04',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 9,
      name: 'Tom Anderson',
      role: 'Secondary',
      team: 'Mobile Team',
      startDate: '2025-10-04',
      endDate: '2025-10-04',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 10,
      name: 'Sophie Brown',
      role: 'Primary',
      team: 'Frontend Team',
      startDate: '2025-10-05',
      endDate: '2025-10-05',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 11,
      name: 'Ryan Davis',
      role: 'Secondary',
      team: 'DevOps Team',
      startDate: '2025-10-02',
      endDate: '2025-10-02',
      startTime: '08:00',
      endTime: '20:00'
    },
    {
      id: 6,
      name: 'Lisa Zhang',
      role: 'Primary',
      team: 'DevOps Team',
      startDate: '2025-10-03',
      endDate: '2025-10-03',
      startTime: '08:00',
      endTime: '20:00'
    }
  ];

  const monthlyRotation = [
    { week: 'Week 1', primary: 'Sarah Chen', secondary: 'Mike Rodriguez', escalation: 'Emma Watson' },
    { week: 'Week 2', primary: 'Alex Kumar', secondary: 'David Park', escalation: 'Lisa Zhang' },
    { week: 'Week 3', primary: 'Jordan Smith', secondary: 'Taylor Brown', escalation: 'Casey Johnson' },
    { week: 'Week 4', primary: 'Morgan Davis', secondary: 'Riley Wilson', escalation: 'Avery Martinez' }
  ];

  // Calendar generation
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendar();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getScheduleForDate = (date) => {
    // Mock function to get schedule for a specific date
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return null; // Weekend
    
    return {
      primary: currentOnCall[0],
      secondary: currentOnCall[1]
    };
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(upcomingSchedule.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentScheduleItems = upcomingSchedule.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">On-Call Schedule</h1>
            <p className="text-gray-600">Manage team schedules and on-call rotations</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select 
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id} className="text-gray-900">{team.name}</option>
            ))}
          </select>
          
          <div className="flex bg-white border border-gray-300 rounded-lg">
            {['month', 'week', 'day'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 text-sm font-medium capitalize ${
                  selectedView === view
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${view === 'month' ? 'rounded-l-lg' : view === 'day' ? 'rounded-r-lg' : ''}`}
              >
                {view}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowAddSchedule(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </button>
        </div>
      </div>

      {/* Current On-Call Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {currentOnCall.map((person) => (
          <div key={person.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                person.role === 'Primary' ? 'bg-green-100 text-green-900' :
                person.role === 'Secondary' ? 'bg-blue-100 text-blue-900' : 'bg-yellow-100 text-yellow-900'
              }`}>
                {person.role}
              </div>
              <div className={`w-3 h-3 rounded-full ${
                person.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{person.avatar}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{person.name}</h3>
                <p className="text-sm text-gray-600">{person.team}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-800 font-medium">
                <Clock className="w-4 h-4 mr-2 text-gray-700" />
                {formatTime(person.startTime.split(' ')[1])} - {formatTime(person.endTime.split(' ')[1])} {person.timezone}
              </div>
              <div className="flex items-center text-sm text-gray-800 font-medium">
                <Phone className="w-4 h-4 mr-2 text-gray-700" />
                {person.phone}
              </div>
              <div className="flex items-center text-sm text-gray-800 font-medium">
                <Mail className="w-4 h-4 mr-2 text-gray-700" />
                {person.email}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                <Phone className="w-4 h-4 mr-1" />
                Call
              </button>
              <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar and Schedule Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Schedule Calendar</h2>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button 
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div key={day} className="p-3 text-center text-sm font-bold text-gray-700 bg-gray-50 rounded-lg">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const schedule = getScheduleForDate(day);
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg transition-colors hover:bg-gray-50 ${
                    isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-bold mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-500'
                  } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                    {day.getDate()}
                  </div>
                  
                  {schedule && (
                    <div className="space-y-1">
                      <div className="text-xs bg-green-100 text-green-900 px-2 py-1 rounded truncate font-medium">
                        P: {schedule.primary.name.split(' ')[0]}
                      </div>
                      <div className="text-xs bg-blue-100 text-blue-900 px-2 py-1 rounded truncate font-medium">
                        S: {schedule.secondary.name.split(' ')[0]}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Schedule */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Schedule</h2>
              <Timer className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="space-y-4 mb-4">
              {currentScheduleItems.map((schedule) => (
                <div key={schedule.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{schedule.name}</h3>
                      <p className="text-sm text-gray-600">{schedule.team}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      schedule.role === 'Primary' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {schedule.role}
                    </div>
                  </div>
                  <div className="text-xs text-gray-700 font-medium">
                    {schedule.startDate} • {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, upcomingSchedule.length)} of {upcomingSchedule.length} schedules
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === index + 1
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Rotation */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Monthly Rotation</h2>
              <RotateCcw className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="space-y-3">
              {monthlyRotation.map((rotation, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">{rotation.week}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Primary:</span>
                      <span className="font-bold text-gray-900">{rotation.primary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Secondary:</span>
                      <span className="font-bold text-gray-900">{rotation.secondary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Escalation:</span>
                      <span className="font-bold text-gray-900">{rotation.escalation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left border border-gray-200">
                <Bell className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Create Override</div>
                  <div className="text-sm text-gray-600">Temporary schedule change</div>
                </div>
              </button>
              
              <button className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left border border-gray-200">
                <RotateCcw className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Setup Rotation</div>
                  <div className="text-sm text-gray-600">Configure auto-rotation</div>
                </div>
              </button>
              
              <button className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left border border-gray-200">
                <Settings className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Manage Teams</div>
                  <div className="text-sm text-gray-600">Edit team members</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnCallSchedulePage;
