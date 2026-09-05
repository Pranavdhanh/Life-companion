'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from './ui/Toast';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initial check
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      toast('Back online!', 'success');
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  if (!isOffline) return null;

  return (
    <div className="w-full bg-amber-500 text-white text-center py-2 px-4 sticky top-0 z-50">
      You are offline. Some features may be limited.
    </div>
  );
}
