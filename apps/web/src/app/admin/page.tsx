'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import { useWallet } from '../../hooks/useWallet';
import {
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  CheckSquare,
  Activity,
  AlertTriangle,
  Send,
  Calendar,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';

export default function AdminDashboard() {
  const { init, markets, fetchMarkets } = useWallet();

  // Active form states for creating markets
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('IPL');
  const [image, setImage] = useState('');
  const [endDate, setEndDate] = useState('');
  const [liquidity, setLiquidity] = useState('150');
  const [aiConfidence, setAiConfidence] = useState('50');
  const [marketSentiment, setMarketSentiment] = useState('Neutral');
  const [trendingNarrative, setTrendingNarrative] = useState('');

  // Admin submit actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Resolution states
  const [isResolving, setIsResolving] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null);

  // Risk Audit states
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchRiskTelemetry = async () => {
    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4050') + '/api/v1';
      const res = await fetch(`${API_URL}/admin/trades`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.data) {
          setRecentTrades(payload.data.trades || []);
          setAlerts(payload.data.alerts || []);
        }
      }
    } catch (e) {
      console.error('Error fetching risk telemetry:', e);
    }
  };

  useEffect(() => {
    init();
    fetchRiskTelemetry();

    const timer = setInterval(() => {
      fetchMarkets();
      fetchRiskTelemetry();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!title || !description || !endDate) {
      setSubmitError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4050') + '/api/v1';
      const res = await fetch(`${API_URL}/admin/markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          image: image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
          endDate: new Date(endDate).toISOString(),
          liquidity: parseFloat(liquidity) || 100,
          aiConfidence: parseFloat(aiConfidence) || 50,
          marketSentiment,
          trendingNarrative: trendingNarrative || 'Standard odds trade',
        }),
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        setSubmitSuccess('Market created successfully and queued on predictions grid!');
        setTitle('');
        setDescription('');
        setEndDate('');
        setImage('');
        setTrendingNarrative('');
        fetchMarkets();
      } else {
        setSubmitError(payload.error?.message || 'Failed to create market.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveMarket = async (marketId: string, outcome: 'YES' | 'NO') => {
    setIsResolving(marketId);
    setResolveSuccess(null);

    try {
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4050') + '/api/v1';
      const res = await fetch(`${API_URL}/admin/markets/${marketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });

      const payload = await res.json();
      if (res.ok && payload.success) {
        setResolveSuccess(`Resolved and settled payouts successfully to ${outcome}!`);
        fetchMarkets();
        fetchRiskTelemetry();
        setTimeout(() => setResolveSuccess(null), 6000);
      }
    } catch (e) {
      console.error('Error resolving market:', e);
    } finally {
      setIsResolving(null);
    }
  };

  const activeMarkets = markets.filter((m) => !m.resolved);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
        <MobileHeader />

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h2 className="text-3xl font-extrabold font-heading text-white tracking-wide flex items-center gap-2">
              <span>Internal Admin Desk</span>
              <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            </h2>
            <p className="text-xs text-muted font-medium mt-1">
              Create prediction events, execute atomic payouts resolution, and monitor platform trading risk.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Market Column (Wizard) */}
            <div className="lg:col-span-2 bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2">
                <PlusCircle className="w-4.5 h-4.5 text-brand-accent" />
                Market Creation Wizard
              </h3>

              <form onSubmit={handleCreateMarket} className="space-y-4 text-xs font-semibold text-gray-400">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Will CSK win the IPL Final match tonight?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                    >
                      <option value="IPL">IPL</option>
                      <option value="Finance">Finance</option>
                      <option value="Politics">Politics</option>
                      <option value="Bollywood">Bollywood</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Details about event, resolution rules, and settled parameters..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">End Date Expiry</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Initial Liquidity (b)</label>
                    <input
                      type="number"
                      placeholder="150"
                      value={liquidity}
                      onChange={(e) => setLiquidity(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Confidence Score (%)</label>
                    <input
                      type="number"
                      placeholder="50"
                      value={aiConfidence}
                      onChange={(e) => setAiConfidence(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Market Sentiment</label>
                    <select
                      value={marketSentiment}
                      onChange={(e) => setMarketSentiment(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                    >
                      <option value="Neutral">Neutral</option>
                      <option value="Bullish">Bullish</option>
                      <option value="Bearish">Bearish</option>
                      <option value="Volatile">Volatile</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Narrative Summary</label>
                    <input
                      type="text"
                      placeholder="e.g. MS Dhoni tactics is tipping odds..."
                      value={trendingNarrative}
                      onChange={(e) => setTrendingNarrative(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Banner Image URL</label>
                  <input
                    type="text"
                    placeholder="https://unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                  />
                </div>

                {submitError && (
                  <div className="p-3 bg-brand-noMuted border border-brand-no/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-no leading-relaxed">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccess && (
                  <div className="p-3 bg-brand-yesMuted border border-brand-yes/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-yes leading-relaxed">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{submitSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-brand-accent hover:bg-blue-600 rounded-xl text-white font-extrabold uppercase tracking-wider text-xs shadow-glow transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'DEPLOYING EVENT...' : 'DEPLOY LIVE PREDICTION MARKET'}
                </button>
              </form>
            </div>

            {/* Resolution Column */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4 flex flex-col max-h-[420px]">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2 flex-shrink-0">
                  <CheckSquare className="w-4.5 h-4.5 text-brand-yes" />
                  Settle active markets
                </h3>

                {resolveSuccess && (
                  <p className="text-[10px] text-brand-yes font-bold bg-brand-yesMuted p-2 rounded border border-brand-yes/15">{resolveSuccess}</p>
                )}

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                  {activeMarkets.length === 0 ? (
                    <p className="text-center text-gray-500 font-semibold py-12">No active markets to resolve</p>
                  ) : (
                    activeMarkets.map((market) => (
                      <div key={market.id} className="p-3 rounded-xl bg-[#0b0e14] border border-border/60 space-y-2.5">
                        <p className="font-bold text-white line-clamp-2 leading-relaxed">{market.title}</p>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold border-b border-border/30 pb-1.5">
                          <span>Volume: ₹{market.volume.toFixed(0)}</span>
                          <span className="text-brand-accent">{market.category}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveMarket(market.id, 'YES')}
                            disabled={isResolving === market.id}
                            className="flex-1 py-1.5 bg-brand-yes hover:bg-green-600 text-white font-black text-[10px] rounded-lg shadow-glow transition-all duration-200"
                          >
                            SETTLE YES
                          </button>
                          <button
                            onClick={() => handleResolveMarket(market.id, 'NO')}
                            disabled={isResolving === market.id}
                            className="flex-1 py-1.5 bg-brand-no hover:bg-red-600 text-white font-black text-[10px] rounded-lg shadow-glow transition-all duration-200"
                          >
                            SETTLE NO
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Trade Risk Audit Ticker */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4 flex flex-col max-h-[380px]">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2 flex-shrink-0">
                  <Activity className="w-4.5 h-4.5 text-orange-500" />
                  Risk Audits & Anomalies
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-[11px]">
                  {alerts.length === 0 ? (
                    <p className="text-center text-gray-500 font-semibold py-8">No high-risk trade anomalies flagged.</p>
                  ) : (
                    alerts.map((alert, idx) => (
                      <div key={idx} className="p-3 bg-brand-noMuted border border-brand-no/15 rounded-xl text-brand-no font-semibold flex gap-2 leading-relaxed">
                        <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                        <span>{alert.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
