import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form state and validation
 */
export const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouchedState] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  const setTouched = useCallback((name, isTouched = true) => {
    setTouchedState(prev => ({
      ...prev,
      [name]: isTouched
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const value = values[fieldName];
      const rules = validationRules[fieldName];
      
      if (rules.required && (!value || value.trim() === '')) {
        newErrors[fieldName] = `${fieldName} is required`;
        return;
      }
      
      if (value && rules.pattern && !rules.pattern.test(value)) {
        newErrors[fieldName] = rules.message || `Invalid ${fieldName}`;
        return;
      }
      
      if (value && rules.minLength && value.length < rules.minLength) {
        newErrors[fieldName] = `${fieldName} must be at least ${rules.minLength} characters`;
        return;
      }
      
      if (value && rules.maxLength && value.length > rules.maxLength) {
        newErrors[fieldName] = `${fieldName} must be no more than ${rules.maxLength} characters`;
        return;
      }
      
      if (rules.custom && typeof rules.custom === 'function') {
        const customError = rules.custom(value, values);
        if (customError) {
          newErrors[fieldName] = customError;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouchedState(allTouched);
    
    if (validate()) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouched,
    validate,
    handleSubmit,
    reset
  };
};

/**
 * Custom hook for managing loading states
 */
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  const withLoading = useCallback(async (asyncFunction) => {
    setLoading(true);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return [loading, setLoading, withLoading];
};

/**
 * Custom hook for managing authentication state
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      // Here you would make an API call to authenticate
      // For now, we'll simulate a successful login
      const mockUser = {
        id: 1,
        email: credentials.email,
        name: 'John Doe',
        role: 'admin'
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('isAuthenticated', 'true');
      
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  }, []);

  const checkAuth = useCallback(() => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      const storedAuth = localStorage.getItem('isAuthenticated');
      
      if (storedUser && storedAuth === 'true') {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuth
  };
};

/**
 * Custom hook for managing local storage
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};
