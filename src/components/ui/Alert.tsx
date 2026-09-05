import React from 'react';

interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  message: string;
  onClose?: () => void;
}

export function Alert({ variant, message, onClose }: AlertProps) {
  const colors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className={`p-4 border rounded-md flex items-center justify-between ${colors[variant]}`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} aria-label="Close alert" className="opacity-70 hover:opacity-100 ml-4">
          ×
        </button>
      )}
    </div>
  );
}
