'use client';

import { useEffect, useRef } from 'react';

export default function SessionTracker() {
  const isIdle = useRef(false);
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial heartbeat
    sendHeartbeat();

    // Set interval for heartbeat every 2 minutes
    const interval = setInterval(() => {
      sendHeartbeat();
    }, 2 * 60 * 1000); // 2 minutes

    // Activity tracker for IDLE state (5 mins without mouse movement or keypress)
    const resetIdle = () => {
      isIdle.current = false;
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => {
        isIdle.current = true;
        sendHeartbeat(); // Immediate heartbeat to report IDLE
      }, 5 * 60 * 1000); // 5 mins
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keypress', resetIdle);
    window.addEventListener('scroll', resetIdle);
    window.addEventListener('click', resetIdle);
    
    // Start idle timer
    resetIdle();

    return () => {
      clearInterval(interval);
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keypress', resetIdle);
      window.removeEventListener('scroll', resetIdle);
      window.removeEventListener('click', resetIdle);
    };
  }, []);

  const sendHeartbeat = () => {
    fetch('/api/auth/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: isIdle.current ? 'IDLE' : 'ONLINE' }),
    }).catch(err => console.error('Heartbeat failed', err));
  };

  return null; // This is a logic-only component
}
