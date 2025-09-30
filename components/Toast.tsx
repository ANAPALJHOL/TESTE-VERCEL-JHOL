
import React from 'react';

interface ToastProps {
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed bottom-12 right-5 bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 px-5 rounded-lg shadow-lg animate-toast-in-out z-50 font-semibold">
      <i className="fas fa-check-circle mr-2"></i>{message}
    </div>
  );
};
