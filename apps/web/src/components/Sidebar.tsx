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
  const { walletBalance, username, avatar } = useWallet();

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

        {/* User Balance Wallet Card */}
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

        {/* Navigation Feed Links */}
        <nav className="space-y-1.5">
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
      <div className="flex items-center space-x-3.5 pt-4 border-t border-border/60">
        <img
          src={avatar}
          alt={username}
          className="w-10 h-10 rounded-full object-cover border border-border shadow-sm"
        />
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-white truncate">{username}</h4>
          <span className="text-[10px] text-brand-accent font-medium px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20">
            PRO TRADER
          </span>
        </div>
      </div>
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
