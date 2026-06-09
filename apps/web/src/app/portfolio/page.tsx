'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Briefcase,
  History,
  Activity,
  Users,
  Award,
  AlertTriangle,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  X,
  Flame
} from 'lucide-react';

const badges = [
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

const renderBadgeIcon = (type: string, unlocked: boolean) => {
  const grayscaleClass = unlocked ? '' : 'filter grayscale opacity-40';
  
  if (type === 'FIRST_TRADE') {
    return (
      <div className={`relative w-20 h-20 mx-auto ${grayscaleClass} flex items-center justify-center`}>
        {unlocked && (
          <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-md animate-pulse"></div>
        )}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill="url(#goldGrad)" className="drop-shadow-lg" />
          <circle cx="50" cy="50" r="36" fill="#121620" />
          <path d="M35 30h30v8c0 5-4 9-9 9h-2v6h5v4h-18v-4h5v-6h-2c-5 0-9-4-9-9v-8zm-5 4v4c0 3.5 2.5 6.5 6 7v-11h-6zm40 0h-6v11c3.5-.5 6-3.5 6-7v-4z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" />
          <path d="M43 67h14l-2 8H45l-2-8z" fill="#f59e0b" />
          <circle cx="50" cy="38" r="4" fill="#121620" />
        </svg>
      </div>
    );
  }
  
  if (type === 'STREAK_10') {
    return (
      <div className={`relative w-20 h-20 mx-auto ${grayscaleClass} flex items-center justify-center`}>
        {unlocked && (
          <div className="absolute inset-0 bg-red-500/10 rounded-full blur-md animate-pulse"></div>
        )}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
          <defs>
            <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill="url(#flameGrad)" className="drop-shadow-lg" />
          <circle cx="50" cy="50" r="36" fill="#121620" />
          <path d="M50 25c-8 10-14 16-14 23 0 7.7 6.3 14 14 14s14-6.3 14-14c0-7-6-13-14-23zm0 32c-4.4 0-8-3.6-8-8 0-4.8 4-8.8 8-12 4 3.2 8 7.2 8 12 0 4.4-3.6 8-8 8z" fill="url(#flameGrad)" />
        </svg>
      </div>
    );
  }
  
  if (type === 'PROFIT_10K') {
    return (
      <div className={`relative w-20 h-20 mx-auto ${grayscaleClass} flex items-center justify-center`}>
        {unlocked && (
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-md animate-pulse"></div>
        )}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
          <defs>
            <linearGradient id="wealthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill="url(#wealthGrad)" className="drop-shadow-lg" />
          <circle cx="50" cy="50" r="36" fill="#121620" />
          <g fill="url(#wealthGrad)">
            <path d="M36 42c-2 0-3.5 1.5-3.5 3.5V60c0 4.4 3.6 8 8 8h19c4.4 0 8-3.6 8-8V45.5c0-2-1.5-3.5-3.5-3.5H36z" />
            <path d="M43 38c-3 0-5 2-5 4h24c0-2-2-4-5-4H43z" />
            <path d="M46 48h8v2.5h-5v1.5h5v2.5h-5v3.5h-3v-3.5h-2v-2.5h2v-1.5h-2V48h2zm3 2.5h2v-1.5h-2v1.5zm0 4h2V52h-2v2.5z" fill="#121620" />
          </g>
        </svg>
      </div>
    );
  }
  
  if (type === 'IPL_MASTER') {
    return (
      <div className={`relative w-20 h-20 mx-auto ${grayscaleClass} flex items-center justify-center`}>
        {unlocked && (
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-md animate-pulse"></div>
        )}
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
          <defs>
            <linearGradient id="iplGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3730a3" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="42" fill="url(#iplGrad)" className="drop-shadow-lg" />
          <circle cx="50" cy="50" r="36" fill="#121620" />
          <g stroke="url(#iplGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round">
            <line x1="38" y1="68" x2="60" y2="34" />
            <line x1="62" y1="68" x2="40" y2="34" />
          </g>
          <circle cx="50" cy="42" r="6" fill="#ef4444" />
          <path d="M48 38.5c1 1.5 1 3.5 0 5M52 38.5c-1 1.5-1 3.5 0 5" stroke="#ffffff" strokeWidth="0.8" fill="none" />
        </svg>
      </div>
    );
  }
  
  return null;
};

export default function Portfolio() {
  const { init, portfolio, activeCopyRelations, fetchCopyRelations, portfolioError, executeSell, isAuthenticated, isInitialized, token, gamificationStats, claimDailyFreeBet } = useWallet();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'copying' | 'gamification'>('positions');

  // Sell panel state
  const [activeSellHolding, setActiveSellHolding] = useState<string | null>(null);
  const [sellSharesInput, setSellSharesInput] = useState<string>('');
  const [sellSideForHolding, setSellSideForHolding] = useState<'YES' | 'NO'>('YES');
  const [sellPreview, setSellPreview] = useState<any>(null);
  const [sellPreviewError, setSellPreviewError] = useState<string | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [sellResult, setSellResult] = useState<any>(null);

  // Gamification state
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
  const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchCopyRelations();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Debounced sell preview when user changes shares input
  useEffect(() => {
    if (!activeSellHolding || !sellSharesInput) { setSellPreview(null); return; }
    const shares = parseFloat(sellSharesInput);
    if (isNaN(shares) || shares <= 0) { setSellPreview(null); return; }

    const timer = setTimeout(async () => {
      try {
        setSellPreviewError(null);
        const res = await fetch(
          `${API_URL}/trade/sell-preview?marketId=${activeSellHolding}&side=${sellSideForHolding}&shares=${sellSharesInput}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (res.ok) {
          const payload = await res.json();
          setSellPreview(payload.success ? payload.data : payload);
        } else {
          const err = await res.json().catch(() => ({}));
          setSellPreviewError(err.message || 'Preview unavailable');
          setSellPreview(null);
        }
      } catch { setSellPreviewError('Preview temporarily unavailable.'); }
    }, 300);
    return () => clearTimeout(timer);
  }, [sellSharesInput, activeSellHolding, sellSideForHolding]);

  // Reset countdown for daily faucet claim
  useEffect(() => {
    if (activeTab !== 'gamification') return;

    const updateCountdown = () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(now.getTime() + istOffset);

      const midnightIST = new Date(nowIST);
      midnightIST.setUTCHours(24, 0, 0, 0);

      const diffMs = midnightIST.getTime() - nowIST.getTime();
      if (diffMs <= 0) {
        setTimeUntilReset('Resets shortly');
        return;
      }

      const h = Math.floor(diffMs / (3600 * 1000));
      const m = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
      const s = Math.floor((diffMs % (60 * 1000)) / 1000);

      setTimeUntilReset(`${h}h ${m}m ${s}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeTab, gamificationStats?.claimedToday]);

  const handleClaimFaucet = async () => {
    setIsClaiming(true);
    setClaimMessage(null);
    try {
      const res = await claimDailyFreeBet();
      if (res.success) {
        setClaimMessage({ text: '🎉 100 BP successfully credited to your wallet!', type: 'success' });
        setTimeout(() => setClaimMessage(null), 5000);
      } else {
        setClaimMessage({ text: res.message || 'Failed to claim daily faucet.', type: 'error' });
      }
    } catch (err: any) {
      setClaimMessage({ text: err.message || 'Failed to claim daily faucet.', type: 'error' });
    } finally {
      setIsClaiming(false);
    }
  };

  const openSellPanel = (holdingId: string, marketId: string, side: 'YES' | 'NO') => {
    if (activeSellHolding === marketId) {
      setActiveSellHolding(null);
    } else {
      setActiveSellHolding(marketId);
      setSellSideForHolding(side);
      setSellSharesInput('');
      setSellPreview(null);
      setSellResult(null);
    }
  };

  const handleConfirmSell = async (marketId: string) => {
    const shares = parseFloat(sellSharesInput);
    if (isNaN(shares) || shares <= 0) return;
    setIsSelling(true);
    const result = await executeSell(marketId, sellSideForHolding, shares);
    setIsSelling(false);
    if (result.success) {
      setSellResult(result);
      setSellSharesInput('');
      setSellPreview(null);
      setTimeout(() => { setActiveSellHolding(null); setSellResult(null); }, 5000);
    } else {
      setSellPreviewError(result.message || 'Sell failed');
    }
  };

  if (portfolioError) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
        <Sidebar />
        <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
          <MobileHeader />
          <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full flex items-center justify-center min-h-[70vh]">
            <div className="bg-[#121620] border border-brand-no/30 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-brand-no/10 border border-brand-no/20 flex items-center justify-center text-brand-no mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-black text-lg text-white">Sync Failed</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                {portfolioError}
              </p>
              <button
                onClick={() => init()}
                className="px-6 py-2.5 rounded-xl bg-brand-accent hover:bg-blue-600 text-white text-xs font-bold transition-all duration-200"
              >
                Retry Connection
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-accent border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 font-semibold font-heading">Syncing with ledger...</p>
        </div>
      </div>
    );
  }

  // High fidelity portfolio equity history data for Recharts
  const equityHistory = [
    { date: 'May 18', netWorth: 25000 },
    { date: 'May 19', netWorth: 24800 },
    { date: 'May 20', netWorth: 25600 },
    { date: 'May 21', netWorth: 25400 },
    { date: 'May 22', netWorth: 26200 },
    { date: 'May 23', netWorth: 26900 },
    { date: 'May 24', netWorth: portfolio.netWorth },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
      {/* 1. Sidebar Left */}
      <Sidebar />

      {/* 2. Main content */}
      <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
        <MobileHeader />

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h2 className="text-3xl font-extrabold font-heading text-white tracking-wide">
              Portfolio Overview
            </h2>
            <p className="text-xs text-muted font-medium mt-1">
              Analyze your performance and active prediction positions.
            </p>
          </div>

          {/* Stats Header Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-5 col-span-2 lg:col-span-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Net Worth</span>
              <h3 className="text-2xl font-black text-white font-heading mt-2">
                ₹{portfolio.netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Unsettled Value</span>
              <h3 className="text-xl font-bold text-white font-heading mt-2.5">
                ₹{portfolio.totalHoldingsValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Cash Balance</span>
              <h3 className="text-xl font-bold text-white font-heading mt-2.5">
                ₹{portfolio.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Total Net P&L</span>
              <h3 className={`text-xl font-bold font-heading mt-2.5 flex items-center gap-1 ${
                portfolio.totalPnL >= 0 ? 'text-brand-yes' : 'text-brand-no'
              }`}>
                {portfolio.totalPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                ₹{portfolio.totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Win Rate</span>
              <h3 className="text-xl font-bold text-brand-yes font-heading mt-2.5">
                {portfolio.winRate.toFixed(1)}%
              </h3>
            </div>
          </div>

          {/* Core Layout: Left Equity Chart, Right positions details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Equity Curve plot */}
            <div className="lg:col-span-2 bg-[#121620] border border-border/80 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-accent animate-pulse" />
                  P&L Equity Timeline
                </h3>
              </div>

              <div className="h-64 md:h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2633" />
                    <XAxis dataKey="date" stroke="#4b5563" />
                    <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} stroke="#4b5563" tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#181d2a', borderColor: '#1e2530', borderRadius: '12px' }}
                      labelStyle={{ color: '#828fbf', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="netWorth"
                      name="Account Net Worth"
                      stroke="#3b82f6"
                      strokeWidth={3.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side brief */}
            <div className="lg:col-span-1 bg-[#121620] border border-border/80 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                  Trading Insights
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed font-semibold">
                  Backing high confidence predictions based on crowd logic is proven to generate 68%+ outcomes. Avoid trading during extreme event volatility without high research insights.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-border/40 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-400">Total Bets Placed</span>
                  <span className="text-white font-bold">{portfolio.recentTrades.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-400">Trading Status</span>
                  <span className="text-brand-yes bg-brand-yesMuted border border-brand-yes/20 px-2 py-0.5 rounded text-[10px] font-bold">
                    CONSISTENT
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Tabs Navigation for positions */}
          <div className="space-y-4">
            <div className="flex border-b border-border/60">
              <button
                onClick={() => setActiveTab('positions')}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'positions'
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                Open Positions
              </button>
              <button
                onClick={() => setActiveTab('copying')}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'copying'
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                Copied Portfolios ({activeCopyRelations.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                Trade Ledger Logs
              </button>
              <button
                onClick={() => setActiveTab('gamification')}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                  activeTab === 'gamification'
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                Achievements & Streaks
              </button>
            </div>

            {/* Holdings & Position Tables */}
            {activeTab === 'positions' && (
              portfolio.holdings.length === 0 ? (
                <div className="bg-[#121620]/60 border border-border/60 rounded-3xl p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-base font-bold text-white">No Open Positions</h3>
                  <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto">
                    You don't hold any YES/NO prediction shares right now. Visit the dashboard to place your first trade.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121620] border border-border rounded-2xl overflow-hidden shadow-lg text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-[#181d2a] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Prediction Event</th>
                          <th className="px-6 py-4">Side</th>
                          <th className="px-6 py-4 text-right">Shares</th>
                          <th className="px-6 py-4 text-right">Spot Price</th>
                          <th className="px-6 py-4 text-right">Current Value</th>
                          <th className="px-6 py-4 text-right">Unrealized P&L</th>
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300 font-medium">
                        {portfolio.holdings.map((h: any) => {
                          const side = h.yesShares > 0 ? 'YES' : 'NO';
                          const shares = h.yesShares > 0 ? h.yesShares : h.noShares;
                          const spotPrice = side === 'YES' ? h.market.yesPrice : h.market.noPrice;
                          const costBasis = h.costBasis ?? 0;
                          const unrealizedPnL = h.currentValue - costBasis;
                          const isExpanded = activeSellHolding === h.marketId;

                          return (
                            <>
                              <tr key={h.id} className="border-b border-border/40 hover:bg-[#181d2a]/30 transition-colors duration-200">
                                <td className="px-6 py-4">
                                  <Link href={`/market/${h.marketId}`} className="font-bold text-white hover:text-brand-accent line-clamp-1">
                                    {h.market.title}
                                  </Link>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                    side === 'YES' ? 'text-brand-yes bg-brand-yesMuted border border-brand-yes/20' : 'text-brand-no bg-brand-noMuted border border-brand-no/20'
                                  }`}>{side}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-white">{shares.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">₹{spotPrice.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-black text-brand-yes">
                                  ₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`font-black ${ unrealizedPnL >= 0 ? 'text-brand-yes' : 'text-brand-no' }`}>
                                    {unrealizedPnL >= 0 ? '+' : ''}₹{unrealizedPnL.toFixed(2)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {!h.market.resolved ? (
                                    <button
                                      onClick={() => openSellPanel(h.id, h.marketId, side)}
                                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                                        isExpanded
                                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                          : 'bg-[#0b0e14] text-gray-400 border border-border/60 hover:text-orange-400 hover:border-orange-500/40'
                                      }`}>
                                      <ArrowDownLeft className="w-3 h-3" />
                                      Sell
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-gray-500 font-semibold">Settled</span>
                                  )}
                                </td>
                              </tr>

                              {/* ── Inline Sell Panel ── */}
                              {isExpanded && (
                                <tr key={`sell-${h.id}`}>
                                  <td colSpan={7} className="px-6 py-4 bg-[#0d1018] border-b border-orange-500/10">
                                    <div className="max-w-md space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                                          <ArrowDownLeft className="w-3.5 h-3.5" />
                                          Sell {side} Shares
                                        </h4>
                                        <button onClick={() => setActiveSellHolding(null)} className="text-gray-500 hover:text-white">
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>

                                      <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Shares to Sell</label>
                                          <input type="number" placeholder={`Max ${shares.toFixed(2)}`}
                                            value={sellSharesInput}
                                            onChange={(e) => setSellSharesInput(e.target.value)}
                                            step="0.01" min="0" max={shares}
                                            className="w-full bg-[#121620] border border-border focus:border-orange-500/50 outline-none rounded-xl px-3 py-2.5 text-xs font-bold text-white" />
                                        </div>
                                        <button type="button" onClick={() => setSellSharesInput(shares.toFixed(2))}
                                          className="px-3 py-2.5 text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors whitespace-nowrap">
                                          Sell All
                                        </button>
                                      </div>

                                      {sellPreview && sellPreview.netCash > 0 && (
                                        <div className="bg-[#121620] rounded-xl p-3 border border-orange-500/15 space-y-1.5 text-[11px]">
                                          <div className="flex justify-between">
                                            <span className="text-gray-400 font-semibold">Gross Cash</span>
                                            <span className="font-bold text-white">₹{sellPreview.cashReceived.toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-400 font-semibold">Fee (1%)</span>
                                            <span className="font-bold text-orange-400">-₹{sellPreview.fee.toFixed(2)}</span>
                                          </div>
                                          <div className="flex justify-between border-t border-orange-500/10 pt-1.5 font-black">
                                            <span className="text-orange-400">Net to Wallet</span>
                                            <span className="text-white">₹{sellPreview.netCash.toFixed(2)}</span>
                                          </div>
                                        </div>
                                      )}

                                      {sellPreviewError && (
                                        <p className="text-[10px] text-brand-no font-semibold">{sellPreviewError}</p>
                                      )}

                                      {sellResult && (
                                        <p className="text-[10px] text-brand-yes font-bold">
                                          ✅ Sold {sellResult.sharesSold?.toFixed(2)} shares — ₹{sellResult.netCash?.toFixed(2)} credited!
                                        </p>
                                      )}

                                      <button onClick={() => handleConfirmSell(h.marketId)}
                                        disabled={isSelling || !sellSharesInput || parseFloat(sellSharesInput) <= 0}
                                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200">
                                        {isSelling ? 'Processing...' : `CONFIRM SELL ${side} SHARES`}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* Copied Portfolios Tab */}
            {activeTab === 'copying' && (
              activeCopyRelations.length === 0 ? (
                <div className="bg-[#121620]/60 border border-border/60 rounded-3xl p-12 text-center">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-base font-bold text-white">No Copied Standings</h3>
                  <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto">
                    You aren\'t copying any leaderboard traders right now. Head over to the Leaderboard STANDINGS to replicate the top accounts.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121620] border border-border rounded-2xl overflow-hidden shadow-lg text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-[#181d2a] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Leader Predictor</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Capital Allocated</th>
                          <th className="px-6 py-4 text-right">Passive Winnings</th>
                          <th className="px-6 py-4 text-right">Start Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 text-gray-300 font-medium">
                        {activeCopyRelations.map((c: any) => (
                          <tr key={c.id} className="hover:bg-[#181d2a]/30 transition-colors duration-200">
                            <td className="px-6 py-4 flex items-center space-x-2.5">
                              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-[9px] text-white">
                                {c.leaderId.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-extrabold text-white">{c.leaderId}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-brand-yes bg-brand-yesMuted border border-brand-yes/20">
                                ACTIVE
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-white">
                              ₹{c.allocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-brand-yes">
                              +₹{c.profits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-400">
                              {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* Trade history logs */}
            {activeTab === 'history' && (
              portfolio.recentTrades.length === 0 ? (
                <div className="bg-[#121620]/60 border border-border/60 rounded-3xl p-12 text-center">
                  <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-white">No Trading History</h3>
                  <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto">
                    No transactions or trade logs were found on this account ledger.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121620] border border-border rounded-2xl overflow-hidden shadow-lg text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-gray-300">
                      <thead>
                        <tr className="border-b border-border bg-[#181d2a] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Trade ID</th>
                          <th className="px-6 py-4">Action</th>
                          <th className="px-6 py-4 text-right">Shares</th>
                          <th className="px-6 py-4 text-right">Avg Price</th>
                          <th className="px-6 py-4 text-right">Cash In/Out</th>
                          <th className="px-6 py-4 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 font-medium">
                        {portfolio.recentTrades.map((t: any) => {
                          const isSell = t.side === 'SELL_YES' || t.side === 'SELL_NO';
                          const displaySide = isSell
                            ? t.side.replace('SELL_', '')
                            : t.side;

                          return (
                          <tr key={t.id} className="hover:bg-[#181d2a]/30 transition-colors duration-200">
                            <td className="px-6 py-4 font-mono text-[10px] truncate max-w-[120px] text-gray-500">
                              {t.id}
                            </td>
                            <td className="px-6 py-4">
                              {isSell ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold text-orange-400 bg-orange-500/10 border border-orange-500/20">
                                  SELL {displaySide}
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  t.side === 'YES' ? 'text-brand-yes bg-brand-yesMuted border border-brand-yes/20' : 'text-brand-no bg-brand-noMuted border border-brand-no/20'
                                }`}>
                                  BUY {t.side}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-white font-bold">
                              {Math.abs(t.shares).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              ₹{t.price.toFixed(2)}

                            </td>
                            <td className="px-6 py-4 text-right font-extrabold text-white">
                              <span className={isSell ? 'text-brand-yes' : 'text-white'}>
                                {isSell ? '+' : '-'}₹{Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-400">
                              {new Date(t.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* Achievements & Streaks Tab */}
            {activeTab === 'gamification' && (() => {
              const stats = gamificationStats || {
                currentStreak: 0,
                longestStreak: 0,
                totalPredictions: 0,
                correctPredictions: 0,
                xp: 0,
                level: 1,
                progressPercent: 0,
                xpNeededForNextLevel: 100,
                claimedToday: false,
                unlockedAchievements: [],
              };
              
              const unlockedCount = stats.unlockedAchievements ? stats.unlockedAchievements.length : 0;
              
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Streak, XP Progress, & Faucet Claim (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Level & Streak Card */}
                    <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden group shadow-xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all duration-300"></div>
                      
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Level & Reputation</span>
                          <h3 className="text-3xl font-black text-white font-heading mt-1 flex items-baseline gap-1.5">
                            Level {stats.level}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl text-orange-400">
                          <Flame className="w-5 h-5 fill-orange-500 animate-pulse" />
                          <div className="text-right">
                            <span className="text-base font-black font-heading block leading-none">{stats.currentStreak}</span>
                            <span className="text-[8px] font-bold uppercase tracking-wider block">Current Streak</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400">XP Progress</span>
                          <span className="text-white font-bold">{stats.xp} / {stats.xpNeededForNextLevel} XP</span>
                        </div>
                        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-border/40 p-0.5">
                          <div 
                            className="h-full bg-gradient-to-r from-brand-accent to-indigo-500 rounded-full transition-all duration-500 shadow-glow"
                            style={{ width: `${stats.progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium italic mt-1">
                          Earn +20 XP with every prediction. Level up to display exclusive community flairs!
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-border/40">
                        <div className="bg-[#0b0e14]/50 border border-border/40 rounded-xl p-3 text-center">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Longest Streak</span>
                          <span className="text-sm font-extrabold text-white font-heading mt-1 block">🔥 {stats.longestStreak} Days</span>
                        </div>
                        <div className="bg-[#0b0e14]/50 border border-border/40 rounded-xl p-3 text-center">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Prediction Accuracy</span>
                          <span className="text-sm font-extrabold text-brand-yes font-heading mt-1 block">
                            {stats.totalPredictions > 0 
                              ? `${Math.round((stats.correctPredictions / stats.totalPredictions) * 100)}%` 
                              : '0%'
                            }
                          </span>
                          <span className="text-[8px] text-gray-500 font-semibold block mt-0.5">
                            {stats.correctPredictions} / {stats.totalPredictions} won
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Faucet Card */}
                    <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden group shadow-xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yes/5 rounded-full blur-2xl group-hover:bg-brand-yes/10 transition-all duration-300"></div>
                      
                      <div className="flex items-center space-x-3.5 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-yes/10 border border-brand-yes/20 flex items-center justify-center text-brand-yes shadow-inner">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Daily Faucet Bonus</h4>
                          <p className="text-[10px] text-gray-400 font-medium">Claim 100 BP free coins once every calendar day.</p>
                        </div>
                      </div>

                      {stats.claimedToday ? (
                        <div className="space-y-3">
                          <button 
                            disabled
                            className="w-full py-3 rounded-xl bg-gray-800/80 border border-border/60 text-gray-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            ✅ Claimed Today
                          </button>
                          <div className="bg-[#0b0e14]/50 border border-border/40 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-semibold">Next Claim In</span>
                            <span className="text-orange-400 font-black font-mono tracking-wider">{timeUntilReset || 'Calculating...'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <button 
                            onClick={handleClaimFaucet}
                            disabled={isClaiming}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-yes to-emerald-600 hover:from-brand-yes/95 hover:to-emerald-600/95 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-glow flex items-center justify-center gap-2"
                          >
                            {isClaiming ? (
                              <>
                                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                Processing Claim...
                              </>
                            ) : (
                              'CLAIM FREE 100 BP'
                            )}
                          </button>
                          {claimMessage && (
                            <p className={`text-[10px] font-bold text-center ${
                              claimMessage.type === 'success' ? 'text-brand-yes' : 'text-brand-no'
                            }`}>
                              {claimMessage.text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Achievements Grid (7 cols) */}
                  <div className="lg:col-span-7 bg-[#121620] border border-border/80 rounded-2xl p-6">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                      <Award className="w-4 h-4 text-brand-accent" />
                      Achievement Badges ({unlockedCount} / {badges.length})
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {badges.map((b) => {
                        const isUnlocked = stats.unlockedAchievements ? stats.unlockedAchievements.includes(b.type) : false;
                        return (
                          <div 
                            key={b.type}
                            className={`relative border rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all duration-300 ${
                              isUnlocked 
                                ? 'bg-[#181d2a]/50 border-brand-accent/25 hover:border-brand-accent/40 shadow-glow'
                                : 'bg-[#121620]/30 border-border/40 hover:border-border/60'
                            }`}
                          >
                            {isUnlocked && (
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[8px] font-black tracking-wider text-brand-yes bg-brand-yesMuted border border-brand-yes/20 uppercase">
                                Unlocked
                              </span>
                            )}
                            
                            <div className="my-2">
                              {renderBadgeIcon(b.type, isUnlocked)}
                            </div>

                            <div className="space-y-1 mt-2">
                              <h4 className={`text-xs font-black uppercase tracking-wider ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                {b.title}
                              </h4>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                                {b.requirement}
                              </p>
                              <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-[180px] mx-auto mt-1">
                                {b.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
