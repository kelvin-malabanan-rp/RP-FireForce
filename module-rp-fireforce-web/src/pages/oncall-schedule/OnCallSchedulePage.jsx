import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import CurrentOnCallSection from './CurrentOnCallSection';
import TeamSelector from './TeamSelector';
import { LoadingState, ErrorState } from './LoadingAndError';
import ScheduleCalendar from './ScheduleCalendar';

const OnCallSchedulePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTeam, setSelectedTeam] = useState('');

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
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.object) {
        setCurrentOnCall(data.object);
      }
    } catch (err) {
      console.error('Error fetching current on-call:', err);
      setCurrentOnCall(null);
    }
  };

  const fetchSchedule = async (teamId, days = 30) => {
    try {
      const response = await fetch(`${BASE_URL}/api/oncall/schedule?teamId=${teamId}&days=${days}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.object && data.object.schedule) {
        setScheduleData(data.object.schedule);
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
                <p className="text-gray-600">Manage team schedules and on-call rotations</p>
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
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
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
                      <span className="text-gray-600">Name:</span>{' '}
                      <span className="font-medium">{teams.find(t => t.id === selectedTeam)?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timezone:</span>{' '}
                      <span className="font-medium">{teams.find(t => t.id === selectedTeam)?.timezone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Members:</span>{' '}
                      <span className="font-medium">{teams.find(t => t.id === selectedTeam)?.members?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OnCallSchedulePage;
