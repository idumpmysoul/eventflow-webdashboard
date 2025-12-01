import React, { useEffect } from 'react';
import { InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';

const Toast = ({ message, type = 'info', duration = 5000, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const typeStyles = {
    info: {
      bg: 'bg-blue-500',
      icon: <InformationCircleIcon className="w-6 h-6 text-white" />,
    },
    alert: {
      bg: 'bg-yellow-500',
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-white" />,
    },
  };

  const styles = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`flex items-center p-4 rounded-lg shadow-2xl text-white ${styles.bg} animate-slideInRightFast w-full max-w-sm`}
    >
      <div className="flex-shrink-0">{styles.icon}</div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        onClick={onDismiss}
        className="ml-auto -mx-1.5 -my-1.5 bg-white/20 hover:bg-white/30 rounded-lg p-1.5 inline-flex h-8 w-8"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
