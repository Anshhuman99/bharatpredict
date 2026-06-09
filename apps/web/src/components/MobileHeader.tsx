'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '../hooks/useWallet';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { Home, PieChart, Wallet, Award, Menu } from 'lucide-react';
import { useState } from 'react';

export default function MobileHeader() {
  const pathname = usePathname();
  const { walletBalance, isAuthenticated, gamificationStats } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Status Bar */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent to-indigo-600 flex items-center justify-center">
            <span className="font-heading font-bold text-white text-sm">🇮🇳</span>
          </div>
          <span className="font-heading font-bold text-base tracking-wide text-foreground">
            BharatPredict
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <ThemeToggle />
          {isAuthenticated && gamificationStats?.currentStreak > 0 && (
            <span className="text-[10px] text-[#ff5722] font-black flex items-center gap-0.5">
              🔥 {gamificationStats.currentStreak}d
            </span>
          )}
          {isAuthenticated && <NotificationBell />}
          {isAuthenticated ? (
            <Link href="/wallet" className="bg-[#121620] border border-border px-3 py-1.5 rounded-xl text-xs font-bold text-white">
              {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })} BP
            </Link>
          ) : (
            <Link href="/login" className="bg-brand-accent text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-glow uppercase tracking-wider text-[10px]">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0f16]/95 border-t border-border backdrop-blur-lg flex justify-around py-3 px-4 z-30">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/dashboard' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/portfolio"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/portfolio' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span>Portfolio</span>
        </Link>
        <Link
          href="/wallet"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/wallet' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Wallet</span>
        </Link>
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
            pathname === '/leaderboard' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <Award className="w-5 h-5" />
          <span>Ranks</span>
        </Link>
      </nav>
    </>
  );
}
