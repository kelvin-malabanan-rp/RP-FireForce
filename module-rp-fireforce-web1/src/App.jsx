import { useState, useEffect } from 'react'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { authService } from './services'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated()
      setIsLoggedIn(isAuth)
      setIsLoading(false)
    }
    
    checkAuth()

    // Periodically check auth status in case it was cleared by API interceptor
    const authCheckInterval = setInterval(() => {
      const isAuth = authService.isAuthenticated()
      if (isAuth !== isLoggedIn) {
        setIsLoggedIn(isAuth)
      }
    }, 1000) // Check every second

    return () => {
      clearInterval(authCheckInterval)
    }
  }, [isLoggedIn])

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    authService.logout()
    setIsLoggedIn(false)
  }

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (isLoggedIn) {
    return <DashboardPage onLogout={handleLogout} />
  }

  return <LoginPage onLogin={handleLogin} />
}

export default App
