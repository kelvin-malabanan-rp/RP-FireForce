import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import DashboardLayout from './layout/DashboardLayout';



const AppWithAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAuth = localStorage.getItem('isAuthenticated');
    
    if (storedUser && storedAuth === 'true') {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    setIsAuthenticated(false);
  };

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
