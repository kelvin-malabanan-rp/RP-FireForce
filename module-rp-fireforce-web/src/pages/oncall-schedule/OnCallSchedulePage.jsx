import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import CurrentOnCallSection from './CurrentOnCallSection';
import TeamSelector from './TeamSelector';
import { LoadingState, ErrorState } from './LoadingAndError';
import ScheduleCalendar from './ScheduleCalendar';
import CreateOverrideModal from './CreateOverrideModal';
import ScheduleDayModal from './ScheduleDayModal';

const OnCallSchedulePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // API state management
  const [teams, setTeams] = useState([]);
  const [currentOnCall, setCurrentOnCall] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

  // API Functions
  const fetchTeams = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/teams`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.object) {
        setTeams(data.object);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams');
    }
  };

  const fetchCurrentOnCall = async (teamId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/current?teamId=${teamId}`);
      
      // Handle 404 gracefully - team may not have current on-call data
      if (response.status === 404) {
        console.log(`No current on-call data for team ${teamId}`);
        setCurrentOnCall(null);
        return;
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.object) {
        setCurrentOnCall(data.object);
      } else {
        setCurrentOnCall(null);
      }
    } catch (err) {
      console.error('Error fetching current on-call:', err);
      setCurrentOnCall(null);
    }
  };

  const fetchSchedule = async (teamId, days = 30) => {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/schedule?teamId=${teamId}&days=${days}`);
      
      // Handle 404 gracefully - team may not have schedule data
      if (response.status === 404) {
        console.log(`No schedule data for team ${teamId}`);
        setScheduleData([]);
        return;
      }
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.object && data.object.schedule) {
        setScheduleData(data.object.schedule);
      } else {
        setScheduleData([]);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setScheduleData([]);
    }
  };

  // Load data on component mount and team change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await fetchTeams();
      } catch (err) {
        setError('Failed to initialize page data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-select first team when teams are loaded and no team is selected
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id);
    }
  }, [teams, selectedTeam]);

  useEffect(() => {
    if (selectedTeam) {
      fetchCurrentOnCall(selectedTeam);
      fetchSchedule(selectedTeam);
    } else {
      setCurrentOnCall(null);
      setScheduleData([]);
    }
  }, [selectedTeam]);

  // Helper functions
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchTeams().finally(() => setLoading(false));
  };

  const handleTeamChange = (teamId) => {
    setSelectedTeam(teamId);
  };

  const handleNavigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDayClick = (date, schedule) => {
    setSelectedDay(date);
    setSelectedDaySchedule(schedule);
    setIsDayModalOpen(true);
  };

  const handleSaveSchedule = async (newSchedule) => {
    try {
      // Save to backend via override API
      // Convert single day schedule to 24-hour override
      const startTime = new Date(newSchedule.date);
      startTime.setHours(0, 0, 0, 0);
      
      const endTime = new Date(newSchedule.date);
      endTime.setHours(23, 59, 59, 999);

      // Create overrides for each role that has a user assigned
      const overrides = [];
      
      if (newSchedule.assignment?.primary) {
        overrides.push({
          teamId: selectedTeam,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          userId: newSchedule.assignment.primary.id,
          role: 'primary',
          reason: `Schedule assignment for ${newSchedule.date}`
        });
      }
      
      if (newSchedule.assignment?.backup) {
        overrides.push({
          teamId: selectedTeam,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          userId: newSchedule.assignment.backup.id,
          role: 'backup',
          reason: `Schedule assignment for ${newSchedule.date}`
        });
      }
      
      if (newSchedule.assignment?.escalation?.length > 0) {
        newSchedule.assignment.escalation.forEach(member => {
          overrides.push({
            teamId: selectedTeam,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            userId: member.id,
            role: 'escalation',
            reason: `Schedule assignment for ${newSchedule.date}`
          });
        });
      }

      // Send all overrides to backend
      for (const override of overrides) {
        const response = await fetch(`${BASE_URL}/api/oncall/override`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(override)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save ${override.role} assignment`);
        }
      }

      // Update local state only after successful save
      const updatedScheduleData = [...scheduleData];
      const existingIndex = updatedScheduleData.findIndex(s => s.date === newSchedule.date);
      
      if (existingIndex >= 0) {
        updatedScheduleData[existingIndex] = newSchedule;
      } else {
        updatedScheduleData.push(newSchedule);
      }
      
      setScheduleData(updatedScheduleData);
      
      // Refresh schedule from backend
      await fetchSchedule(selectedTeam);
      
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule: ' + error.message);
    }
  };

  const handleDeleteSchedule = (date) => {
    // Update local state
    const newScheduleData = scheduleData.filter(s => s.date !== date);
    setScheduleData(newScheduleData);
    console.log('Schedule deleted for date:', date);
    // TODO: Add API call to delete from backend
  };

  const getTeamMembers = () => {
    if (!selectedTeam || !teams.length) return [];
    const team = teams.find(t => t.id === selectedTeam);
    return team?.members || [];
  };

  const handleCreateOverride = async (overrideData) => {
    try {
      // Format dates to ISO string
      const payload = {
        ...overrideData,
        startTime: new Date(overrideData.startTime).toISOString(),
        endTime: new Date(overrideData.endTime).toISOString()
      };

      const response = await fetch(`${BASE_URL}/api/oncall/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      // Refresh the schedule data
      if (selectedTeam) {
        await fetchSchedule(selectedTeam);
        await fetchCurrentOnCall(selectedTeam);
      }
      
      alert('Override created successfully!');
      return data;
    } catch (err) {
      console.error('Error creating override:', err);
      throw new Error('Failed to create override. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Loading State */}
      {loading && <LoadingState message="Loading on-call schedule..." />}

      {/* Error State */}
      {error && <ErrorState error={error} onRetry={handleRetry} />}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">On-Call Schedule</h1>
                <p className="text-gray-900 font-semibold">Manage team schedules and on-call rotations</p>
              </div>
            </div>
            
            <TeamSelector 
              teams={teams}
              selectedTeam={selectedTeam}
              onTeamChange={handleTeamChange}
              loading={loading}
            />
          </div>

          {/* Current On-Call Status */}
          <CurrentOnCallSection 
            currentOnCall={currentOnCall}
            startTime={currentOnCall?.startTime}
            endTime={currentOnCall?.endTime}
          />

          {/* Calendar and Schedule Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ScheduleCalendar 
              scheduleData={scheduleData}
              currentDate={currentDate}
              onNavigateMonth={handleNavigateMonth}
              onDayClick={handleDayClick}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Override
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  View Full Schedule
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Manage Teams
                </button>
              </div>

              {/* Team Info */}
              {selectedTeam && teams.find(t => t.id === selectedTeam) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-900 font-semibold">Name:</span>{' '}
                      <span className="font-bold text-gray-900">{teams.find(t => t.id === selectedTeam)?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-900 font-semibold">Timezone:</span>{' '}
                      <span className="font-bold text-gray-900">{teams.find(t => t.id === selectedTeam)?.timezone}</span>
                    </div>
                    <div>
                      <span className="text-gray-900 font-semibold">Members:</span>{' '}
                      <span className="font-bold text-gray-900">{teams.find(t => t.id === selectedTeam)?.members?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Create Override Modal */}
      <CreateOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        teams={teams}
        onSubmit={handleCreateOverride}
      />

      {/* Schedule Day Modal */}
      {isDayModalOpen && selectedDay && (
        <ScheduleDayModal
          date={selectedDay}
          schedule={selectedDaySchedule}
          onClose={() => {
            setIsDayModalOpen(false);
            setSelectedDay(null);
            setSelectedDaySchedule(null);
          }}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          teamMembers={getTeamMembers()}
        />
      )}
    </div>
  );
};

export default OnCallSchedulePage;
