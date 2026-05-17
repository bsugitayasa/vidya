import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/axios';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart', 'click'];
const WARNING_SECONDS = 30; // Show warning 30 seconds before logout
const DEFAULT_TIMEOUT_MINUTES = 5;

export default function useIdleTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_SECONDS);
  const logout = useAuthStore((state) => state.logout);
  const { pathname } = useLocation();

  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);
  const timeoutMinutesRef = useRef(DEFAULT_TIMEOUT_MINUTES);
  const showWarningRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Fetch timeout config from server — re-fetch on every route change
  // so changes saved in Pengaturan are picked up immediately
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/konfigurasi');
        if (res.data.success) {
          const configData = res.data.data;
          if (configData.admin_idle_timeout) {
            const val = parseInt(configData.admin_idle_timeout.nilai);
            if (!isNaN(val) && val > 0 && val !== timeoutMinutesRef.current) {
              timeoutMinutesRef.current = val;
              // Restart timer with new value
              startTimer();
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch idle timeout config:', err);
      }
    };
    fetchConfig();
  }, [pathname]);

  const doLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    showWarningRef.current = false;
    logout();
    window.location.href = '/admin/login';
  }, [logout]);

  function clearAllTimers() {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (warningTimeoutRef.current) { clearTimeout(warningTimeoutRef.current); warningTimeoutRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }

  function startTimer() {
    clearAllTimers();
    setShowWarning(false);
    showWarningRef.current = false;
    setCountdown(WARNING_SECONDS);

    const timeoutMs = timeoutMinutesRef.current * 60 * 1000;
    const warningMs = timeoutMs - (WARNING_SECONDS * 1000);

    // Set warning timer (fires 30s before logout)
    if (warningMs > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        showWarningRef.current = true;
        setCountdown(WARNING_SECONDS);

        // Start countdown
        let remaining = WARNING_SECONDS;
        countdownRef.current = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            doLogout();
          }
        }, 1000);
      }, warningMs);
    } else {
      // Timeout is less than 30s, show warning immediately
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        showWarningRef.current = true;
        const totalSeconds = Math.max(1, Math.floor(timeoutMs / 1000));
        setCountdown(totalSeconds);

        let remaining = totalSeconds;
        countdownRef.current = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            doLogout();
          }
        }, 1000);
      }, 0);
    }
  }

  // Handle user staying logged in
  const stayLoggedIn = useCallback(() => {
    startTimer();
  }, []);

  // Setup event listeners (runs once on mount)
  useEffect(() => {
    // Throttle the event handler to avoid excessive resets
    let throttleTimer = null;

    const handleActivity = () => {
      // Only reset if warning is NOT showing
      if (!showWarningRef.current) {
        startTimer();
      }
    };

    const throttledHandler = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        handleActivity();
      }, 1000);
    };

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, throttledHandler, { passive: true });
    });

    // Initial timer start
    startTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, throttledHandler);
      });
      clearAllTimers();
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []); // Empty deps - runs once on mount

  return {
    showWarning,
    countdown,
    stayLoggedIn,
    performLogout: doLogout,
    timeoutMinutes: timeoutMinutesRef.current
  };
}

