import React, { useState } from 'react';
import { Eye, EyeOff, Shield, AlertCircle, CheckCircle, Loader2, Lock, Mail } from 'lucide-react';

const EnhancedLoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Username validation
  const validateUsername = (username) => {
    return username.length >= 3;
  };

  // Password validation
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
    if (name === 'email' && value && !validateUsername(value)) {
      setErrors(prev => ({
        ...prev,
        email: 'Username must be at least 3 characters long'
      }));
    }

    if (name === 'password' && value && !validatePassword(value)) {
      setErrors(prev => ({
        ...prev,
        password: 'Password must be at least 6 characters long'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Username is required';
    } else if (!validateUsername(formData.email)) {
      newErrors.email = 'Username must be at least 3 characters long';
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

    setIsSubmitting(true);
    
    try {
      // Check for dummy credentials
      if (formData.email === 'admin' && formData.password === 'admin123') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockUser = {
          id: 1,
          email: 'admin',
          name: 'Administrator',
          role: 'admin'
        };
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Reload page to trigger auth check
        window.location.reload();
      } else {
        setErrors({ general: 'Invalid credentials. Use admin / admin123' });
      }
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClasses = (fieldName) => {
    const baseClasses = "w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-900 placeholder-gray-500 shadow-sm";
    
    if (errors[fieldName]) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50`;
    }
    
    if (touched[fieldName] && formData[fieldName] && !errors[fieldName]) {
      return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50/50`;
    }
    
    return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 hover:border-blue-300 hover:shadow-md`;
  };

  const getIconClasses = (fieldName) => {
    if (errors[fieldName]) {
      return "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-400";
    }
    
    if (touched[fieldName] && formData[fieldName] && !errors[fieldName]) {
      return "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400";
    }
    
    return "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/25 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-800 rounded-3xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <Shield className="w-12 h-12 text-white relative z-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Sign in to your FireForce account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30 relative overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5 rounded-3xl"></div>
          <div className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* General Error */}
            {errors.general && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{errors.general}</span>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-bold text-gray-800">
                Username
              </label>
              <div className="relative">
                <Mail className={getIconClasses('email')} />
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={getInputClasses('email')}
                  placeholder="Enter username (admin)"
                  disabled={isSubmitting}
                />
                {touched.email && formData.email && !errors.email && (
                  <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-bold text-gray-800">
                Password
              </label>
              <div className="relative">
                <Lock className={getIconClasses('password')} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={getInputClasses('password')}
                  placeholder="Enter password (admin123)"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100/80"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center group cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
                  disabled={isSubmitting}
                />
                <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button className="text-blue-600 hover:text-blue-500 font-semibold transition-colors hover:underline">
                  Create Account
                </button>
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-xs text-gray-500">
            🔒 Protected by FireForce Security System
          </p>
          <div className="max-w-sm mx-auto p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 shadow-sm">
            <div className="flex items-center justify-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-3">Demo Credentials</p>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs text-gray-600 font-medium">Username:</span>
                <code className="text-xs bg-white px-3 py-1 rounded-lg border font-mono text-blue-700">admin</code>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs text-gray-600 font-medium">Password:</span>
                <code className="text-xs bg-white px-3 py-1 rounded-lg border font-mono text-blue-700">admin123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoginPage;
