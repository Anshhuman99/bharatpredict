'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Bell, Coins, Users, TrendingUp, Clock, Check, CheckCheck } from 'lucide-react';

export default function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TRADE':
        return <TrendingUp className="w-4 h-4 text-indigo-400" />;
      case 'SETTLEMENT':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'COPY_TRADE':
        return <Users className="w-4 h-4 text-sky-400" />;
      case 'MARKET_CLOSING':
        return <Clock className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-brand-accent" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-gray-300 hover:text-white transition-all duration-200"
        aria-label="Toggle notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-no text-[10px] font-black text-white ring-2 ring-[#0b0e14] shadow-glow">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-no opacity-45"></span>
            <span className="relative">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 md:left-0 mt-2.5 w-80 bg-[#121620]/95 border border-border/80 rounded-2xl backdrop-blur-xl shadow-glow overflow-hidden z-50 origin-top-right md:origin-top-left animate-slide-in flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-[#151a26]/50">
            <span className="text-xs font-bold text-white font-heading">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="text-[10px] font-bold text-brand-accent hover:text-white flex items-center gap-1 transition-colors duration-200"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-xs font-medium">
                <Bell className="w-6 h-6 text-gray-600 mx-auto mb-2 opacity-50" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  className={`px-4 py-3.5 flex gap-3.5 items-start cursor-pointer transition-all duration-200 hover:bg-[#181d2a] ${
                    !n.read ? 'bg-[#181d2a]/30 border-l-2 border-brand-accent' : ''
                  }`}
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-white/5 border border-white/5 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-[11px] font-bold text-white truncate font-heading">{n.title}</h4>
                      <span className="text-[9px] text-gray-500 font-semibold flex-shrink-0">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-gray-400 leading-normal font-medium">{n.body}</p>
                  </div>
                  {!n.read && (
                    <div className="flex-shrink-0 self-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-accent block"></span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer view-all placeholder if needed, otherwise clean padding */}
          <div className="px-4 py-2 bg-[#151a26]/30 border-t border-border/40 text-center">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              Showing last 50 alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
