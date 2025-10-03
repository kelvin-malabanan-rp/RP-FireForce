import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import DashboardLayout from './layout/DashboardLayout';



const AppWithAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from API
  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`https://incident-webhook-api.rapidresponse.workers.dev/api/users/by-id?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.httpStatus === 'OK' && result.data) {
        setUser(result.data);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(result.data));
        return result.data;
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If API fails, try to use stored data as fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        return userData;
      }
      return null;
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      
      if (storedAuth === 'true' && storedUser) {
        setIsAuthenticated(true);
        const userData = JSON.parse(storedUser);
        
        // If we have a user ID, fetch fresh data from API
        if (userData.id) {
          await fetchUserData(userData.id);
        } else {
          setUser(userData);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('activeTab'); // Clear stored active tab on logout
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout 
      user={user} 
      onLogout={handleLogout} 
    />
  );
};

export default AppWithAuth;
