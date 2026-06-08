'use client';

import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import { useWallet } from '../../hooks/useWallet';
import { Award, Target, Flame, DollarSign, Crown, Users, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Leaderboard() {
  const { init, startCopyTrading, walletBalance } = useWallet();

  // Copy Trading Modal states
  const [selectedLeader, setSelectedLeader] = useState<any | null>(null);
  const [allocationAmount, setAllocationAmount] = useState<string>('5000');
  const [isSubmittingCopy, setIsSubmittingCopy] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const topThree = [
    {
      id: 'amit-verma-uuid',
      username: 'Amit Verma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      earnings: '₹2,84,500',
      accuracy: '81.4%',
      volume: '₹8.4L',
    },
    {
      id: 'prerna-kapoor-uuid',
      username: 'Prerna Kapoor',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
      earnings: '₹1,95,000',
      accuracy: '76.8%',
      volume: '₹5.2L',
    },
    {
      id: 'rajesh-nair-uuid',
      username: 'Rajesh Nair',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      earnings: '₹1,42,000',
      accuracy: '72.5%',
      volume: '₹3.9L',
    },
  ];

  const rankingList = [
    { id: 'siddharth-sen-uuid', rank: 4, name: 'Siddharth Sen', accuracy: '70.2%', earnings: '₹1,24,000', volume: '₹3.4L' },
    { id: 'neha-sharma-uuid', rank: 5, name: 'Neha Sharma', accuracy: '69.8%', earnings: '₹1,18,500', volume: '₹2.8L' },
    { id: 'vikram-mehta-uuid', rank: 6, name: 'Vikram Mehta', accuracy: '68.5%', earnings: '₹95,200', volume: '₹2.1L' },
    { id: 'ananya-roy-uuid', rank: 7, name: 'Ananya Roy', accuracy: '67.4%', earnings: '₹88,000', volume: '₹1.9L' },
    { id: 'kunal-patil-uuid', rank: 8, name: 'Kunal Patil', accuracy: '66.9%', earnings: '₹72,400', volume: '₹1.5L' },
  ];

  const handleCopyClick = (leader: any) => {
    setCopyError(null);
    setCopySuccess(false);
    setSelectedLeader(leader);
  };

  const handleCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader) return;
    setIsSubmittingCopy(true);
    setCopyError(null);

    const amt = parseFloat(allocationAmount);
    if (isNaN(amt) || amt <= 0) {
      setCopyError('Please enter a valid INR allocation');
      setIsSubmittingCopy(false);
      return;
    }

    if (amt > walletBalance) {
      setCopyError(`Insufficient balance. You have ₹${walletBalance.toFixed(2)}`);
      setIsSubmittingCopy(false);
      return;
    }

    const res = await startCopyTrading(selectedLeader.id, amt);
    if (res.success) {
      setCopySuccess(true);
      setTimeout(() => {
        setSelectedLeader(null);
        setCopySuccess(false);
      }, 2000);
    } else {
      setCopyError(res.message || 'Failed to start copy trading.');
    }
    setIsSubmittingCopy(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
        <MobileHeader />

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold font-heading text-white tracking-wide">
              Prediction Leaders
            </h2>
            <p className="text-xs text-muted font-medium mt-1">
              Top performing predictors. Click "Copy Trades" to mirror their prediction splits.
            </p>
          </div>

          {/* Podium layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 items-end">
            
            {/* Rank 2 - Prerna */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 text-center space-y-4 md:order-1 relative overflow-hidden order-2">
              <span className="absolute top-3 left-3 text-xs font-bold text-gray-500 font-heading">#2</span>
              <img
                src={topThree[1].avatar}
                alt={topThree[1].username}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-400"
              />
              <div>
                <h3 className="text-sm font-bold text-white truncate">{topThree[1].username}</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1 flex items-center justify-center gap-1">
                  <Target className="w-3.5 h-3.5 text-brand-yes" /> {topThree[1].accuracy} accuracy
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
                <span className="font-black text-sm text-white">{topThree[1].earnings}</span>
                <button
                  onClick={() => handleCopyClick(topThree[1])}
                  className="w-full py-2 bg-brand-accent hover:bg-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white shadow-glow transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> Copy Trades
                </button>
              </div>
            </div>

            {/* Rank 1 - Amit */}
            <div className="bg-[#121620] border border-brand-accent/40 rounded-3xl p-8 text-center space-y-4 md:order-2 md:-translate-y-4 relative overflow-hidden shadow-glow order-1">
              <div className="absolute top-4 right-4 text-yellow-500">
                <Crown className="w-6 h-6 animate-bounce" />
              </div>
              <span className="absolute top-3 left-3 text-xs font-bold text-brand-accent font-heading">#1</span>
              <img
                src={topThree[0].avatar}
                alt={topThree[0].username}
                className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-yellow-500 shadow-lg"
              />
              <div>
                <h3 className="text-base font-black text-white truncate">{topThree[0].username}</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1 flex items-center justify-center gap-1">
                  <Target className="w-3.5 h-3.5 text-brand-yes" /> {topThree[0].accuracy} accuracy
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-3 border-t border-border/40">
                <span className="font-black text-base text-brand-yes">{topThree[0].earnings}</span>
                <button
                  onClick={() => handleCopyClick(topThree[0])}
                  className="w-full py-2.5 bg-brand-yes hover:bg-green-600 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-white shadow-glow transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <Users className="w-4 h-4" /> Copy Trades
                </button>
              </div>
            </div>

            {/* Rank 3 - Rajesh */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 text-center space-y-4 md:order-3 relative overflow-hidden order-3">
              <span className="absolute top-3 left-3 text-xs font-bold text-gray-500 font-heading">#3</span>
              <img
                src={topThree[2].avatar}
                alt={topThree[2].username}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-amber-600"
              />
              <div>
                <h3 className="text-sm font-bold text-white truncate">{topThree[2].username}</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-1 flex items-center justify-center gap-1">
                  <Target className="w-3.5 h-3.5 text-brand-yes" /> {topThree[2].accuracy} accuracy
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
                <span className="font-black text-sm text-white">{topThree[2].earnings}</span>
                <button
                  onClick={() => handleCopyClick(topThree[2])}
                  className="w-full py-2 bg-brand-accent hover:bg-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white shadow-glow transition-all duration-200 flex items-center justify-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" /> Copy Trades
                </button>
              </div>
            </div>

          </div>

          {/* Active standings list */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-border/40 pb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-accent" /> Active Standings
            </h3>

            <div className="bg-[#121620] border border-border rounded-2xl overflow-hidden shadow-lg text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-[#181d2a] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Predictor</th>
                    <th className="px-6 py-4 text-right">Accuracy Rate</th>
                    <th className="px-6 py-4 text-right">Volume Traded</th>
                    <th className="px-6 py-4 text-right">Total Earnings</th>
                    <th className="px-6 py-4 text-center">Copy Trading</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-gray-300 font-medium">
                  {rankingList.map((row) => (
                    <tr key={row.rank} className="hover:bg-[#181d2a]/30 transition-all duration-200">
                      <td className="px-6 py-4 font-bold text-brand-accent">
                        #{row.rank}
                      </td>
                      <td className="px-6 py-4 flex items-center space-x-3.5">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-black text-[10px] text-white">
                          {row.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-white">{row.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-brand-yes">
                        {row.accuracy}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.volume}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-white">
                        {row.earnings}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleCopyClick(row)}
                          className="px-4 py-1.5 bg-[#0b0e14] hover:bg-brand-accent/15 border border-border hover:border-brand-accent/50 text-gray-300 hover:text-brand-accent font-bold rounded-xl text-[10px] uppercase transition-all duration-200"
                        >
                          Copy Trades
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Copy Trading Allocation Modal */}
      {selectedLeader && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-[#121620] border border-border rounded-3xl p-6 max-w-sm w-full text-center relative overflow-hidden animate-fade-in space-y-5 shadow-2xl">
            
            <div>
              <h3 className="font-heading font-black text-lg text-white">Mirror Predictor Splits</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">
                Allocating capital to copy {selectedLeader.username || selectedLeader.name}
              </p>
            </div>

            <form onSubmit={handleCopySubmit} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                  Allocate Capital (Simulated INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-sm font-black text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={allocationAmount}
                    onChange={(e) => setAllocationAmount(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl pl-8 pr-4 py-3.5 text-sm font-black text-white"
                  />
                </div>
              </div>

              {/* Quick shortcut buttons */}
              <div className="flex gap-2">
                {['1000', '2500', '5000', '10000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAllocationAmount(val)}
                    className="flex-1 py-2 rounded-lg bg-[#0b0e14] hover:bg-[#181d2a] border border-border hover:border-brand-accent text-[10px] font-bold text-gray-300 transition-all duration-200"
                  >
                    ₹{parseInt(val).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Dynamic feedback messages */}
              {copyError && (
                <div className="p-3 bg-brand-noMuted border border-brand-no/20 rounded-xl flex items-start gap-2 text-[10px] text-brand-no leading-relaxed">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{copyError}</span>
                </div>
              )}

              {copySuccess ? (
                <div className="py-3 rounded-xl bg-brand-yesMuted border border-brand-yes/30 flex items-center justify-center gap-1.5 text-xs text-brand-yes font-bold text-center w-full">
                  <ShieldCheck className="w-5 h-5 animate-bounce" /> COPY TRADING SPRINT STARTED!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmittingCopy}
                  className="w-full py-3.5 rounded-xl bg-brand-yes hover:bg-green-600 text-white font-extrabold uppercase tracking-wide text-xs shadow-glow transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingCopy ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      ALLOCATING FUNDS...
                    </>
                  ) : (
                    'CONFIRM COPY ALLOCATION'
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedLeader(null)}
                disabled={isSubmittingCopy}
                className="w-full py-3.5 rounded-xl bg-[#0b0e14] hover:bg-[#181d2a] border border-border text-gray-400 hover:text-white font-bold text-xs transition-all duration-200"
              >
                CANCEL
              </button>
            </form>
            
          </div>
        </div>
      )}
    </div>
  );
}
