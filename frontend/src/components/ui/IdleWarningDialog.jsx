import React from 'react';
import { LogOut, RefreshCw, Clock } from 'lucide-react';

export default function IdleWarningDialog({ open, countdown, onStayLoggedIn, onLogout }) {
  if (!open) return null;

  const progressPercent = (countdown / 30) * 100;
  const isUrgent = countdown <= 10;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div 
            className={`h-full transition-all duration-1000 ease-linear rounded-r-full ${
              isUrgent ? 'bg-red-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isUrgent ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <Clock 
              size={32} 
              className={`${isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} 
            />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Sesi Tidak Aktif
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 mb-4">
            Anda akan otomatis logout dalam
          </p>

          {/* Countdown */}
          <div className={`text-5xl font-bold mb-4 tabular-nums ${
            isUrgent ? 'text-red-500' : 'text-amber-500'
          }`}>
            {countdown}
            <span className="text-lg font-normal text-gray-400 ml-1">detik</span>
          </div>

          <p className="text-xs text-gray-400 mb-6">
            karena tidak ada aktivitas
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
            <button
              onClick={onStayLoggedIn}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              <RefreshCw size={16} />
              Tetap Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
