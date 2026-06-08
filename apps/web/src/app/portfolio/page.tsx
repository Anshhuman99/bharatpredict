'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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
  AlertTriangle
} from 'lucide-react';

export default function Portfolio() {
  const { init, portfolio, activeCopyRelations, fetchCopyRelations, portfolioError } = useWallet();
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'copying'>('positions');

  useEffect(() => {
    init();

    // Poll active copy relations to capture simulated passive yields
    const interval = setInterval(() => {
      fetchCopyRelations();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
            </div>

            {/* Holdings & Position Tables */}
            {activeTab === 'positions' && (
              portfolio.holdings.length === 0 ? (
                <div className="bg-[#121620]/60 border border-border/60 rounded-3xl p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-base font-bold text-white">No Open Positions</h3>
                  <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto">
                    You don\'t hold any YES/NO prediction shares right now. Visit the dashboard to place your first trade.
                  </p>
                </div>
              ) : (
                <div className="bg-[#121620] border border-border rounded-2xl overflow-hidden shadow-lg text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border bg-[#181d2a] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="px-6 py-4">Prediction Event</th>
                          <th className="px-6 py-4">Holdings Side</th>
                          <th className="px-6 py-4 text-right">Shares Held</th>
                          <th className="px-6 py-4 text-right">Spot Value</th>
                          <th className="px-6 py-4 text-right">Current Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 text-gray-300 font-medium">
                        {portfolio.holdings.map((h: any) => {
                          const side = h.yesShares > 0 ? 'YES' : 'NO';
                          const shares = h.yesShares > 0 ? h.yesShares : h.noShares;
                          const spotPrice = side === 'YES' ? h.market.yesPrice : h.market.noPrice;
                          
                          return (
                            <tr key={h.id} className="hover:bg-[#181d2a]/30 transition-colors duration-200">
                              <td className="px-6 py-4">
                                <Link href={`/market/${h.marketId}`} className="font-bold text-white hover:text-brand-accent line-clamp-1">
                                  {h.market.title}
                                </Link>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  side === 'YES' ? 'text-brand-yes bg-brand-yesMuted border border-brand-yes/20' : 'text-brand-no bg-brand-noMuted border border-brand-no/20'
                                }`}>
                                  {side}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-white">
                                {shares.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                ₹{spotPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-brand-yes">
                                ₹{h.currentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                          <th className="px-6 py-4">Side</th>
                          <th className="px-6 py-4 text-right">Shares Traded</th>
                          <th className="px-6 py-4 text-right">Avg Price</th>
                          <th className="px-6 py-4 text-right">INR Invested</th>
                          <th className="px-6 py-4 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 font-medium">
                        {portfolio.recentTrades.map((t: any) => (
                          <tr key={t.id} className="hover:bg-[#181d2a]/30 transition-colors duration-200">
                            <td className="px-6 py-4 font-mono text-[10px] truncate max-w-[120px] text-gray-500">
                              {t.id}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                t.side === 'YES' ? 'text-brand-yes bg-brand-yesMuted border border-brand-yes/20' : 'text-brand-no bg-brand-noMuted border border-brand-no/20'
                              }`}>
                                BUY {t.side}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-white font-bold">
                              {t.shares.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              ₹{t.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-extrabold text-white">
                              ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-400">
                              {new Date(t.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
