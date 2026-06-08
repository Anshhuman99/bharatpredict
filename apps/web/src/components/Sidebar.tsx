'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useWallet } from '../hooks/useWallet';
import {
  TrendingUp,
  Award,
  Wallet,
  PieChart,
  Home,
  Flame,
  Globe,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cat = searchParams.get('cat') || '';
  const { walletBalance, username, avatar, isAuthenticated, logout } = useWallet();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Sports', href: '/dashboard?cat=IPL', icon: Flame },
    { name: 'Politics', href: '/dashboard?cat=Politics', icon: Globe },
    { name: 'Finance', href: '/dashboard?cat=Finance', icon: TrendingUp },
    { name: 'Portfolio', href: '/portfolio', icon: PieChart },
    { name: 'Leaderboard', href: '/leaderboard', icon: Award },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Admin Panel', href: '/admin', icon: ShieldCheck },
  ];

  const checkIsActive = (itemHref: string) => {
    if (itemHref.startsWith('/dashboard')) {
      if (itemHref.includes('cat=')) {
        const itemCat = itemHref.split('cat=')[1];
        return pathname === '/dashboard' && cat === itemCat;
      }
      return pathname === '/dashboard' && !cat;
    }
    return pathname === itemHref;
  };

  return (
    <aside className="w-64 border-r border-border bg-[#0b0e14]/90 backdrop-blur-md h-screen fixed left-0 top-0 hidden md:flex flex-col justify-between p-6 z-20">
      <div className="space-y-8">
        {/* Brand Logo Header */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-accent to-indigo-600 flex items-center justify-center shadow-glow">
            <span className="font-heading font-bold text-white text-lg">🇮🇳</span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              BharatPredict
            </h1>
            <p className="text-[10px] text-muted tracking-wider uppercase font-semibold">
              Trade India's Future
            </p>
          </div>
        </div>

        {/* User Balance Wallet Card / Guest Card */}
        {isAuthenticated ? (
          <div className="bg-[#121620] border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-xl group-hover:bg-brand-accent/10 transition-all duration-300"></div>
            <p className="text-xs text-muted font-medium mb-1 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-brand-accent" /> Available Balance
            </p>
            <h2 className="text-2xl font-bold text-white font-heading">
              ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <Link 
              href="/wallet"
              className="mt-3 flex items-center justify-between text-xs text-brand-accent hover:text-white font-semibold transition-colors duration-200"
            >
              Manage Wallet <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="bg-[#121620] border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-xl transition-all duration-300"></div>
            <p className="text-xs text-muted font-medium mb-1 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-gray-500" /> Guest Mode
            </p>
            <p className="text-[11px] text-gray-400 mb-3">Sign in to claim ₹1,000 welcome bonus & start trading.</p>
            <Link 
              href="/login"
              className="w-full py-2 px-3 text-center rounded-xl bg-brand-accent text-white font-black text-[10px] uppercase tracking-wider hover:bg-brand-accent/90 transition-all block shadow-glow"
            >
              Log In / Register
            </Link>
          </div>
        )}

        {/* Navigation Feed Links */}
        <nav className="space-y-1.5 font-semibold">
          {navigationItems.map((item) => {
            const isActive = checkIsActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/25 shadow-sm'
                    : 'text-gray-400 hover:bg-[#121620] hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-accent' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info Footer */}
      {isAuthenticated ? (
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <div className="flex items-center space-x-3 overflow-hidden">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
              alt={username || 'User'}
              className="w-9 h-9 rounded-full object-cover border border-border shadow-sm"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-white truncate max-w-[100px]">{username}</h4>
              <span className="text-[9px] text-brand-accent font-extrabold px-1.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 uppercase tracking-wide">
                PRO TRADER
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-gray-500 hover:text-brand-no transition-colors"
            title="Log Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
      ) : (
        <div className="pt-4 border-t border-border/60">
          <Link
            href="/login"
            className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl border border-border/60 hover:bg-[#121620] hover:text-white text-gray-400 text-xs font-extrabold transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
            <span>Log In to Account</span>
          </Link>
        </div>
      )}
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={
      <aside className="w-64 border-r border-border bg-[#0b0e14]/90 backdrop-blur-md h-screen fixed left-0 top-0 hidden md:flex flex-col p-6 z-20">
        <div className="text-gray-500 text-xs font-semibold">Loading sidebar...</div>
      </aside>
    }>
      <SidebarContent />
    </Suspense>
  );
}
