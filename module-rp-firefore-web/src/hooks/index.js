import { useState, useEffect } from 'react';

/**
 * Custom hook to track viewport size and breakpoints
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('');
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      if (width >= 1280) {
        setBreakpoint('xl');
      } else if (width >= 1024) {
        setBreakpoint('lg');
      } else if (width >= 768) {
        setBreakpoint('md');
      } else if (width >= 640) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    windowSize,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    isLarge: breakpoint === 'xl'
  };
};

/**
 * Custom hook for local storage
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage key "' + key + '":', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error setting localStorage key "' + key + '":', error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Custom hook for debounced values
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for keyboard shortcuts
 */
export const useKeyboardShortcut = (keys, callback, node = null) => {
  useEffect(() => {
    const handler = (event) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      const isPressed = keyArray.every(key => {
        switch (key) {
          case 'ctrl':
            return event.ctrlKey;
          case 'cmd':
            return event.metaKey;
          case 'shift':
            return event.shiftKey;
          case 'alt':
            return event.altKey;
          default:
            return event.key.toLowerCase() === key.toLowerCase();
        }
      });

      if (isPressed) {
        event.preventDefault();
        callback(event);
      }
    };

    const targetNode = node || document;
    targetNode.addEventListener('keydown', handler);

    return () => {
      targetNode.removeEventListener('keydown', handler);
    };
  }, [keys, callback, node]);
};
