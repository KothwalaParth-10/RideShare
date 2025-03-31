import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
  timestamp: number;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (message: string, type: 'success' | 'error') => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const notificationHistory = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create a unique key for this notification
    const now = Date.now();
    const notificationKey = `${message}-${type}-${Math.floor(now / 5000)}`; // Group similar notifications within 5 seconds

    // Check if this notification was recently shown
    if (notificationHistory.current.has(notificationKey)) {
      return; // Skip duplicate notification
    }

    // Add to history and clean up old entries
    notificationHistory.current.add(notificationKey);
    setTimeout(() => {
      notificationHistory.current.delete(notificationKey);
    }, 5000); // Remove from history after 5 seconds

    // Show the new notification
    setNotification({
      id: Math.random().toString(36).substr(2, 9),
      message,
      type,
      timestamp: now
    });

    // Auto-clear after 5 seconds
    timeoutRef.current = setTimeout(clearNotification, 5000);
  }, [clearNotification]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, clearNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};