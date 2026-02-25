import React, { useEffect } from 'react';

interface ToastNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onClose?: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type = 'success',
  visible,
  onClose,
}) => {
  useEffect(() => {
    if (!visible || !onClose) return;
    const timeout = setTimeout(() => {
      onClose();
    }, 10000);
    return () => clearTimeout(timeout);
  }, [visible, onClose]);

  if (!visible) return null;

  const baseColor =
    type === 'success'
      ? 'bg-emerald-500'
      : type === 'error'
      ? 'bg-red-500'
      : 'bg-blue-500';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative flex items-stretch min-w-[260px] max-w-sm shadow-2xl rounded-lg overflow-hidden bg-gray-900/95 text-gray-100 border border-gray-700">
        {/* Angled accent on the left */}
        <div className="relative w-2">
          <div
            className={`absolute -left-3 top-0 bottom-0 w-4 ${baseColor} transform -skew-x-12`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-3 text-sm">
          <div className="font-semibold mb-0.5">
            {type === 'success'
              ? 'Success'
              : type === 'error'
              ? 'Error'
              : 'Notice'}
          </div>
          <div className="text-xs text-gray-300 leading-snug">{message}</div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 text-xs text-gray-400 hover:text-gray-200 flex items-center"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ToastNotification;

