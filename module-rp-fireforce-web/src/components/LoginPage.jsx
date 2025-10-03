import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Chrome,
  Github,
  Mail,
  Flame,
  Users,
  Lock,
  Zap
} from 'lucide-react';

// Particle Background Component
const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;
    const maxDistance = 150;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach((otherParticle) => {
          const distance = Math.sqrt(
            Math.pow(particle.x - otherParticle.x, 2) +
            Math.pow(particle.y - otherParticle.y, 2)
          );

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / maxDistance)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
};

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate on blur
    if (name === 'email' && value && !validateEmail(value)) {
      setErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
    }

    if (name === 'password' && value && !validatePassword(value)) {
      setErrors(prev => ({
        ...prev,
        password: 'Password must be at least 6 characters long'
      }));
    }
  };

  // Social login handlers
  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // TODO: Implement Google OAuth
  };

  const handleGithubLogin = () => {
    console.log('GitHub login clicked');
    // TODO: Implement GitHub OAuth
  };

  const handleMicrosoftLogin = () => {
    console.log('Microsoft login clicked');
    // TODO: Implement Microsoft OAuth
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for emergency admin account first
    if (formData.email === 'admin' && formData.password === 'password') {
      setLoading(true);
      
      // Simulate loading for UX
      setTimeout(() => {
        // Create emergency admin user data
        const emergencyAdminData = {
          id: 'emergency-admin-001',
          email: 'admin@fireforce.emergency',
          firstName: 'Emergency',
          lastName: 'Administrator',
          role: 'Super Admin',
          token: 'emergency-admin-token-' + Date.now(),
          isEmergencyAccount: true
        };
        
        // Store authentication data
        localStorage.setItem('authToken', emergencyAdminData.token);
        localStorage.setItem('userData', JSON.stringify(emergencyAdminData));
        localStorage.setItem('user', JSON.stringify(emergencyAdminData));
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log('Emergency admin login successful:', emergencyAdminData);
        
        // Show success message
        alert('🚨 Emergency Admin Access Granted! Welcome to FireForce Emergency Dashboard.');
        
        // Trigger authentication state change
        window.location.reload();
        
        setLoading(false);
      }, 1000); // 1 second delay for better UX
      
      return;
    }
    
    // Validate all fields for regular login
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting login with:', { email: formData.email, password: '***' });
      
      const response = await fetch('https://incident-webhook-api.rapidresponse.workers.dev/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${responseData.message || 'Unknown error'}`);
      }
      
      if (responseData.httpStatus === 'OK' && responseData.data) {
        // Store authentication data
        const userData = responseData.data;
        
        // Store token in localStorage
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('userData', JSON.stringify({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        }));
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log('Login successful:', userData);
        
        // Show success message
        alert(`Welcome back, ${userData.firstName || userData.lastName || userData.email}!`);
        
        // Trigger authentication state change
        window.location.reload();
        
      } else {
        throw new Error(responseData.message || 'Login failed - Invalid response format');
      }
    } catch (error) {
      console.error('Login error details:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setErrors({ general: 'Invalid email or password. Please check your credentials and try again.' });
      } else if (error.message.includes('404')) {
        setErrors({ general: 'Login service unavailable. Please try again later.' });
      } else if (error.message.includes('500')) {
        setErrors({ general: 'Server error. Please try again later.' });
      } else if (error.name === 'TypeError' || error.message.includes('fetch')) {
        setErrors({ general: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ general: error.message || 'Login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getInputClasses = (fieldName) => {
    const baseClasses = "w-full px-4 py-3 bg-white border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    if (errors[fieldName]) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500`;
    }
    
    if (touched[fieldName] && formData[fieldName] && !errors[fieldName]) {
      return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-500`;
    }
    
    return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-500`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <ParticleBackground />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FireForce</h1>
                <p className="text-xs text-blue-200">Emergency Response System</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-white/80">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Reliable</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-blue-200 text-lg">
              Access your emergency response dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 transform hover:bg-white/15 transition-all duration-300">
            {/* Social Login Options */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGithubLogin}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  <Github className="w-5 h-5" />
                  <span>GitHub</span>
                </button>
                
                <button
                  onClick={handleMicrosoftLogin}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  <Mail className="w-5 h-5" />
                  <span>Microsoft</span>
                </button>
              </div>
            </div>

            {/* Emergency Admin Access */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setFormData({ email: 'admin', password: 'password' });
                  // Auto-submit after setting the values
                  setTimeout(() => {
                    const event = new Event('submit', { bubbles: true, cancelable: true });
                    document.querySelector('form').dispatchEvent(event);
                  }, 100);
                }}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-600/20 text-red-300 border border-red-500/30 rounded-xl font-medium hover:bg-red-600/30 hover:border-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-blue-900 transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">🚨 Emergency Admin Access</span>
              </button>
              <p className="text-xs text-red-300/70 text-center mt-2">
                For emergency situations only
              </p>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/80 font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errors.general}</span>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                  {touched.email && formData.email && !errors.email && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                  )}
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-300 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
                {!errors.email && (
                  <p className="mt-2 text-xs text-white/50">
                    💡 Emergency Access: Use "admin" / "password"
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-300 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400 focus:ring-offset-0"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-white/80">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-300 hover:text-blue-200 font-medium transition-colors"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Sign In to FireForce
                  </div>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="text-center">
                <p className="text-sm text-white/70">
                  Don't have an account?{' '}
                  <button className="text-blue-300 hover:text-blue-200 font-medium transition-colors underline decoration-blue-300/50 hover:decoration-blue-200">
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-black/10 backdrop-blur-sm border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-white/70">
              <span>© 2025 FireForce Emergency Response</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">All rights reserved</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-white/70">
              <button className="hover:text-white transition-colors">Privacy Policy</button>
              <button className="hover:text-white transition-colors">Terms of Service</button>
              <button className="hover:text-white transition-colors">Support</button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-xs text-white/50 flex items-center justify-center space-x-2">
                <Lock className="w-3 h-3" />
                <span>Protected by enterprise-grade security and encryption</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
