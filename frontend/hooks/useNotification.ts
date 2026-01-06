import { useState, useCallback } from 'react';
import { NOTIFICATION_DURATION_MS } from '../config/constants';

export type NotificationType = 'success' | 'error';

export interface Notification {
  message: string;
  type: NotificationType;
}

export function useNotification() {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), NOTIFICATION_DURATION_MS);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
}
