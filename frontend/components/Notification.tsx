import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import type { Notification as NotificationType } from '../hooks/useNotification';

interface NotificationProps {
  notification: NotificationType;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const isError = notification.type === 'error';

  const containerStyles = isError
    ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900 text-red-800 dark:text-red-400'
    : 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900 text-green-800 dark:text-green-400';

  const iconContainerStyles = isError
    ? 'bg-red-200 dark:bg-red-900/50'
    : 'bg-green-200 dark:bg-green-900/50';

  const Icon = isError ? AlertTriangle : CheckCircle;
  const iconColor = isError ? 'text-red-600' : 'text-green-600';

  return (
    <div
      className={`fixed bottom-10 right-10 z-[99999] p-6 rounded-[2.5rem] shadow-2xl border-2 
        flex items-center gap-5 animate-in slide-in-from-right-10 transition-colors ${containerStyles}`}
    >
      <div className={`p-3 rounded-2xl ${iconContainerStyles}`}>
        <Icon size={24} className={iconColor} />
      </div>
      <div className="font-bold text-sm">{notification.message}</div>
      <button
        onClick={onClose}
        className="ml-4 opacity-20 hover:opacity-100 transition-opacity"
        aria-label="Zamknij powiadomienie"
      >
        <X size={20} />
      </button>
    </div>
  );
};
