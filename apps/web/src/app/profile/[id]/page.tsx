'use client';

import { useEffect, useState, use } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import Sidebar from '../../../components/Sidebar';
import MobileHeader from '../../../components/MobileHeader';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Award,
  ArrowLeft,
  Flame,
  Activity,
  History,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

const badgeData = [
  {
    type: 'FIRST_TRADE',
    title: 'First Prediction',
    requirement: '1 Trade Placed',
    description: 'Placed your first prediction trade on BharatPredict.',
  },
  {
    type: 'STREAK_10',
    title: 'Streak Master',
    requirement: '10-Day Streak',
    description: 'Successfully reached 10 consecutive prediction days.',
  },
  {
    type: 'PROFIT_10K',
    title: 'Wealth Builder',
    requirement: '₹10,000 Realized Profit',
    description: 'Accumulated ₹10,000 net profits on resolved markets.',
  },
  {
    type: 'IPL_MASTER',
    title: 'IPL Master',
    requirement: '80%+ IPL Win Rate',
    description: 'Achieved an 80%+ win rate across at least 5 resolved IPL markets.',
  }
];

const renderProfileBadgeIcon = (type: string, unlocked: boolean) => {
  const grayscaleClass = unlocked ? '' : 'filter grayscale opacity-40';
  
  if (type === 'FIRST_TRADE') {
    return (
      <svg viewBox="0 0 100 100" className={`w-12 h-12 ${grayscaleClass}`}>
        <defs>
          <linearGradient id="profileGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#profileGoldGrad)" />
        <circle cx="50" cy="50" r="36" fill="#121620" />
        <path d="M35 30h30v8c0 5-4 9-9 9h-2v6h5v4h-18v-4h5v-6h-2c-5 0-9-4-9-9v-8zm-5 4v4c0 3.5 2.5 6.5 6 7v-11h-6zm40 0h-6v11c3.5-.5 6-3.5 6-7v-4z" fill="#f59e0b" />
        <path d="M43 67h14l-2 8H45l-2-8z" fill="#f59e0b" />
      </svg>
    );
  }
  
  if (type === 'STREAK_10') {
    return (
      <svg viewBox="0 0 100 100" className={`w-12 h-12 ${grayscaleClass}`}>
        <defs>
          <linearGradient id="profileFlameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#profileFlameGrad)" />
        <circle cx="50" cy="50" r="36" fill="#121620" />
        <path d="M50 25c-8 10-14 16-14 23 0 7.7 6.3 14 14 14s14-6.3 14-14c0-7-6-13-14-23zm0 32c-4.4 0-8-3.6-8-8 0-4.8 4-8.8 8-12 4 3.2 8 7.2 8 12 0 4.4-3.6 8-8 8z" fill="url(#profileFlameGrad)" />
      </svg>
    );
  }
  
  if (type === 'PROFIT_10K') {
    return (
      <svg viewBox="0 0 100 100" className={`w-12 h-12 ${grayscaleClass}`}>
        <defs>
          <linearGradient id="profileWealthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#profileWealthGrad)" />
        <circle cx="50" cy="50" r="36" fill="#121620" />
        <g fill="url(#profileWealthGrad)">
          <path d="M36 42c-2 0-3.5 1.5-3.5 3.5V60c0 4.4 3.6 8 8 8h19c4.4 0 8-3.6 8-8V45.5c0-2-1.5-3.5-3.5-3.5H36z" />
          <path d="M43 38c-3 0-5 2-5 4h24c0-2-2-4-5-4H43z" />
          <path d="M46 48h8v2.5h-5v1.5h5v2.5h-5v3.5h-3v-3.5h-2v-2.5h2v-1.5h-2V48h2zm3 2.5h2v-1.5h-2v1.5zm0 4h2V52h-2v2.5z" fill="#121620" />
        </g>
      </svg>
    );
  }
  
  if (type === 'IPL_MASTER') {
    return (
      <svg viewBox="0 0 100 100" className={`w-12 h-12 ${grayscaleClass}`}>
        <defs>
          <linearGradient id="profileIplGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#profileIplGrad)" />
        <circle cx="50" cy="50" r="36" fill="#121620" />
        <g stroke="url(#profileIplGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round">
          <line x1="38" y1="68" x2="60" y2="34" />
          <line x1="62" y1="68" x2="40" y2="34" />
        </g>
        <circle cx="50" cy="42" r="6" fill="#ef4444" />
      </svg>
    );
  }
  
  return null;
};

export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const profileUserId = resolvedParams.id;
  
  const { init, userId: currentUserId } = useWallet();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    init();
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/users/${profileUserId}/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setError(null);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err.message || 'Profile not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to connect to API.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [profileUserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-accent border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 font-semibold">Retrieving public credentials...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
        <Sidebar />
        <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
          <MobileHeader />
          <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full flex items-center justify-center min-h-[70vh]">
            <div className="bg-[#121620] border border-border/80 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <h3 className="font-heading font-black text-lg text-white">Profile Unavailable</h3>
              <p className="text-xs text-gray-400 font-semibold">{error || 'This user does not exist or has set their account to private.'}</p>
              <Link href="/dashboard" className="inline-block px-6 py-2.5 rounded-xl bg-brand-accent hover:bg-blue-600 text-white text-xs font-bold transition-all duration-200">
                Back to Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const stats = profile.stats;
  const portfolio = profile.portfolio;
  const isMe = currentUserId === profile.userId;

  // Level progress percentage
  const progressPercent = Math.min(100, Math.round((stats.xp / stats.xpNeededForNextLevel) * 100));

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
      {/* 1. Sidebar Left */}
      <Sidebar />

      {/* 2. Main content */}
      <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
        <MobileHeader />

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-brand-accent gap-2.5">
            <ArrowLeft className="w-4 h-4" /> BACK TO DASHBOARD
          </Link>

          {/* User Banner Card */}
          <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/5 rounded-full blur-3xl group-hover:bg-brand-accent/10 transition-all duration-300"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <img 
                  src={profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-accent/40 shadow-lg"
                />
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white font-heading tracking-wide flex items-center justify-center md:justify-start gap-2">
                    {profile.username}
                    {isMe && <span className="text-[10px] bg-brand-accent/20 border border-brand-accent/30 text-brand-accent px-2 py-0.5 rounded font-bold uppercase tracking-wider">You</span>}
                  </h2>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                    Member since {new Date(profile.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1 justify-center md:justify-start">
                    <span className="text-[10px] text-brand-accent font-extrabold px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 uppercase tracking-wide">
                      Level {stats.level}
                    </span>
                    {stats.currentStreak > 0 && (
                      <span className="text-[10px] text-[#ff5722] font-black px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 uppercase tracking-wide flex items-center gap-0.5">
                        🔥 {stats.currentStreak}d Streak
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* public stats brief */}
              <div className="flex gap-4">
                <div className="bg-[#0b0e14]/60 border border-border/40 rounded-xl px-4 py-3 text-center min-w-[90px]">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Accuracy</span>
                  <span className="text-lg font-extrabold text-brand-yes font-heading mt-0.5 block">{stats.winRate.toFixed(1)}%</span>
                </div>
                <div className="bg-[#0b0e14]/60 border border-border/40 rounded-xl px-4 py-3 text-center min-w-[90px]">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Predictions</span>
                  <span className="text-lg font-extrabold text-white font-heading mt-0.5 block">{stats.totalPredictions}</span>
                </div>
              </div>
            </div>

            {/* Level progress slider */}
            <div className="mt-6 pt-5 border-t border-border/40 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-400">XP Progress</span>
                <span className="text-white font-bold">{stats.xp} / {stats.xpNeededForNextLevel} XP</span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-border/40 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-brand-accent to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Public Positions & Badges (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Public open holdings */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-accent" />
                  Public Positions ({portfolio.activePositions.length})
                </h3>
                
                {portfolio.activePositions.length === 0 ? (
                  <div className="bg-[#0b0e14]/30 border border-border/40 rounded-xl p-8 text-center text-gray-500 text-xs font-semibold">
                    No active open prediction holdings found on this profile.
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#181d2a] text-gray-400 text-[9px] font-bold uppercase tracking-wider border-b border-border/60">
                          <th className="px-5 py-3">Market Prediction</th>
                          <th className="px-5 py-3">Contracts Held</th>
                          <th className="px-5 py-3 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-gray-300 font-medium">
                        {portfolio.activePositions.map((p: any) => {
                          const side = p.yesShares > 0 ? 'YES' : 'NO';
                          const shares = p.yesShares > 0 ? p.yesShares : p.noShares;
                          return (
                            <tr key={p.id} className="hover:bg-[#181d2a]/30 transition-colors">
                              <td className="px-5 py-3 text-white font-bold max-w-[280px] truncate">
                                <Link href={`/market/${p.marketId}`} className="hover:text-brand-accent">
                                  {p.marketTitle}
                                </Link>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold mr-1.5 ${
                                  side === 'YES' ? 'text-brand-yes bg-brand-yesMuted' : 'text-brand-no bg-brand-noMuted'
                                }`}>
                                  {side}
                                </span>
                                {shares.toFixed(1)}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-white">
                                ₹{p.currentValue.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Achievements row */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-accent" />
                  Unlocked Badges
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {badgeData.map((b) => {
                    const unlocked = profile.achievements.includes(b.type);
                    return (
                      <div 
                        key={b.type}
                        className={`flex items-center gap-3.5 border rounded-xl p-3.5 transition-all duration-300 ${
                          unlocked 
                            ? 'bg-[#181d2a]/50 border-brand-accent/25 shadow-sm'
                            : 'bg-[#121620]/30 border-border/40 opacity-70'
                        }`}
                      >
                        <div className="flex-shrink-0 relative">
                          {renderProfileBadgeIcon(b.type, unlocked)}
                          {!unlocked && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className={`text-xs font-black uppercase tracking-wider ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                            {b.title}
                          </h4>
                          <p className="text-[9px] text-gray-400 font-semibold uppercase">{b.requirement}</p>
                          <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{b.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right: Public Trades Feed (4 cols) */}
            <div className="lg:col-span-4 bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4 h-fit">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-brand-accent" />
                Recent Predictions
              </h3>

              {portfolio.recentTrades.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs font-semibold">
                  No prediction history found.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 text-[11px]">
                  {portfolio.recentTrades.map((t: any) => {
                    const isSell = t.side === 'SELL_YES' || t.side === 'SELL_NO';
                    const side = isSell ? t.side.replace('SELL_', '') : t.side;
                    return (
                      <div key={t.id} className="bg-[#0b0e14]/50 border border-border/40 rounded-xl p-3 space-y-1.5 hover:border-border/60 transition-colors">
                        <div className="flex items-center justify-between">
                          {isSell ? (
                            <span className="px-2 py-0.5 rounded text-[8px] font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 uppercase">
                              SOLD {side}
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              side === 'YES' ? 'text-brand-yes bg-brand-yesMuted border border-brand-yes/20' : 'text-brand-no bg-brand-noMuted border border-brand-no/20'
                            }`}>
                              PREDICTED {side}
                            </span>
                          )}
                          <span className="text-[9px] text-gray-500">
                            {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="font-bold text-white leading-tight">
                          {t.marketTitle}
                        </p>
                        <div className="flex justify-between text-gray-400 text-[10px] font-semibold pt-1 border-t border-border/20">
                          <span>{t.shares.toFixed(1)} Shares</span>
                          <span>Avg: ₹{t.price.toFixed(2)}</span>
                          <span className="text-white font-bold">₹{t.amount.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
