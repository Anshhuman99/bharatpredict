'use client';

import { useEffect, useState } from 'react';
import { Bell, Coins, Users, TrendingUp, X, Clock } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'TRADE' | 'SETTLEMENT' | 'MARKET_CLOSING' | 'COPY_TRADE' | string;
  title: string;
  body: string;
  createdAt?: string;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastMessage>;
      const newToast = customEvent.detail;
      
      setToasts((prev) => {
        // Prevent duplicate toasts
        if (prev.some((t) => t.id === newToast.id)) {
          return prev;
        }
        return [...prev, newToast];
      });

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    };

    window.addEventListener('show_toast', handleToast);
    return () => {
      window.removeEventListener('show_toast', handleToast);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'TRADE':
        return <TrendingUp className="w-5 h-5 text-indigo-400" />;
      case 'SETTLEMENT':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'COPY_TRADE':
        return <Users className="w-5 h-5 text-sky-400" />;
      case 'MARKET_CLOSING':
        return <Clock className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-brand-accent" />;
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#0d1117]/85 border border-white/10 backdrop-blur-xl shadow-glow rounded-2xl p-4 flex gap-3.5 items-start justify-between animate-slide-in hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
        >
          {/* Subtle gradient light flare on top */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent"></div>
          
          <div className="flex-shrink-0 p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
            {getIcon(toast.type)}
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-white leading-tight font-heading">
              {toast.title}
            </h4>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              {toast.body}
            </p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-500 hover:text-white transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
