'use client';

import { useEffect, useState, Suspense } from 'react';
import { useWallet } from '../../hooks/useWallet';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MarketCard from '../../components/MarketCard';
import SkeletonLoader from '../../components/SkeletonLoader';

const FeaturedSparkline = dynamic(() => import('../../components/FeaturedSparkline'), { ssr: false });

import {
  TrendingUp,
  Activity,
  Flame,
  Globe,
  Compass,
  ArrowUpRight,
  MessageSquare,
  Search,
  Bot,
  Zap,
  Sparkles,
  Award,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const catFilter = searchParams.get('cat') || '';
  const { markets, init, globalTrades, fetchMarkets, executeTrade, isAuthenticated } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'trending' | 'live' | 'ending' | 'new'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Right sidebar tab state
  const [sidebarTab, setSidebarTab] = useState<'activity' | 'ai-insights'>('activity');

  // Local trading state for Featured Spotlight
  const [featuredSubmitting, setFeaturedSubmitting] = useState(false);
  const [featuredSuccess, setFeaturedSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Connect websocket and rest feeds
    init();

    // Set up polling interval to keep everything updated in addition to WebSockets
    const interval = setInterval(() => {
      fetchMarkets();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const filteredMarkets = markets.filter((m) => {
    const matchesCategory = catFilter ? m.category.toLowerCase() === catFilter.toLowerCase() : true;
    const matchesSearch = searchQuery
      ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Featured Spotlight Market ( CSK matches or first active market )
  const featuredMarket = markets.find(m => m.category === 'IPL' && !m.resolved) || markets[0];

  // Quick trade execution for Featured Spotlight
  const handleQuickTrade = async (marketId: string, side: 'YES' | 'NO', amount: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setFeaturedSubmitting(true);
    setFeaturedSuccess(null);
    const res = await executeTrade(marketId, side, amount);
    if (res.success) {
      setFeaturedSuccess(`Quick Trade Success! Bought ${res.sharesBought.toFixed(2)} YES shares.`);
      setTimeout(() => setFeaturedSuccess(null), 5000);
      fetchMarkets();
    }
    setFeaturedSubmitting(false);
  };

  // Mock mini sparkline trend data for the Spotlight banner
  const sparklineData = [
    { value: 0.52 },
    { value: 0.55 },
    { value: 0.53 },
    { value: 0.58 },
    { value: 0.62 },
    { value: featuredMarket?.yesPrice || 0.64 }
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
      {/* 1. Sidebar Navigation Left */}
      <Sidebar />

      {/* 2. Main Center-Right Panel */}
      <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
        <MobileHeader />

        {/* Horizontal Bloomberg-style scrolling ticker */}
        {markets.length > 0 && (
          <div className="w-full bg-[#0e121a] border-b border-border/60 overflow-hidden py-2 relative z-10 hidden md:block">
            <div className="animate-ticker flex space-x-12 whitespace-nowrap">
              {[...markets, ...markets, ...markets].map((m, idx) => {
                const yesPercent = Math.round((m.yesPrice || 0.5) * 100);
                return (
                  <div key={idx} className="inline-flex items-center space-x-2.5 text-[11px] font-semibold">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-bold font-heading">
                      {m.category}
                    </span>
                    <span className="text-white truncate max-w-[150px]">
                      {m.title.replace('Will ', '').replace('?', '')}
                    </span>
                    <span className="text-brand-yes font-bold">{yesPercent}% YES</span>
                    <span className="text-[9px] text-gray-500">|</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dash Scroll Area */}
        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search and Dashboard Title Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold font-heading text-white tracking-wide flex items-center gap-2">
                  <span>{catFilter ? `${catFilter} Markets` : 'Explore Markets'}</span>
                  {!catFilter && <Sparkles className="w-5 h-5 text-brand-accent animate-pulse" />}
                </h2>
                <p className="text-xs text-muted font-medium mt-1">
                  Back your predictions on real-world Indian events with fintech precision.
                </p>
              </div>

              {/* Dynamic search bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121620] border border-border/80 focus:border-brand-accent/60 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 font-medium transition-all duration-200"
                />
              </div>
            </div>

            {/* Featured Event Spotlight Card */}
            {!catFilter && featuredMarket && (
              <div className="relative bg-gradient-to-tr from-[#121620] via-[#141b2b] to-[#121620] border border-brand-accent/35 rounded-3xl p-6 overflow-hidden shadow-glow group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-accent/8 transition-all duration-500"></div>
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yes opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-yes"></span>
                  </span>
                  <span className="text-[10px] font-extrabold text-brand-yes uppercase tracking-widest font-heading">Spotlight Event</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  
                  {/* Spotlight event details */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] font-bold text-brand-accent px-2 py-0.5 rounded bg-brand-accent/15 border border-brand-accent/25 uppercase font-heading">
                        {featuredMarket.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-orange-500" />
                        ₹{(featuredMarket.volume || 0).toLocaleString('en-IN')} vol
                      </span>
                    </div>

                    <h3 className="text-xl font-heading font-black text-white leading-tight">
                      {featuredMarket.title}
                    </h3>
                    
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {featuredMarket.description}
                    </p>

                    {/* Sparkline line indicator */}
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-8">
                        <FeaturedSparkline data={sparklineData} />
                      </div>
                      <span className="text-[11px] font-bold text-brand-yes">
                        Trending Up (+6.5%)
                      </span>
                    </div>
                  </div>

                  {/* Spotlight Action Panel */}
                  <div className="bg-[#0b0e14]/65 border border-border/80 rounded-2xl p-4 space-y-3.5 relative z-10 text-center">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-semibold">Buy YES shares at</span>
                      <span className="font-extrabold text-brand-yes text-sm">₹{(featuredMarket.yesPrice || 0.5).toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickTrade(featuredMarket.id, 'YES', 500)}
                        disabled={featuredSubmitting}
                        className="flex-1 py-2.5 bg-brand-yes hover:bg-green-600 text-white font-extrabold text-xs rounded-xl shadow-glow transition-all duration-200"
                      >
                        YES ₹500
                      </button>
                      <button
                        onClick={() => handleQuickTrade(featuredMarket.id, 'NO', 500)}
                        disabled={featuredSubmitting}
                        className="flex-1 py-2.5 bg-brand-no hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-glow transition-all duration-200"
                      >
                        NO ₹500
                      </button>
                    </div>

                    {featuredSuccess && (
                      <p className="text-[10px] text-brand-yes font-semibold animate-pulse">{featuredSuccess}</p>
                    )}

                    <Link
                      href={`/market/${featuredMarket.id}`}
                      className="text-[10px] font-bold text-brand-accent hover:text-white flex items-center justify-center gap-1 transition-colors duration-200"
                    >
                      Detailed Chart & Depth <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                </div>
              </div>
            )}

            {/* Dashboard Tabs Bar */}
            <div className="flex border-b border-border/60">
              {['trending', 'live', 'ending', 'new'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                    activeTab === tab
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-gray-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Empty States and Loading Skeletons */}
            {markets.length === 0 ? (
              <SkeletonLoader type="card" count={4} />
            ) : filteredMarkets.length === 0 ? (
              <div className="bg-[#121620]/60 border border-border/60 rounded-3xl p-12 text-center">
                <Compass className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-base font-bold text-white">No Active Markets Found</h3>
                <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto">
                  We couldn't find any prediction markets matching your filter. Try adjusting your category or query.
                </p>
              </div>
            ) : (
              /* Markets Grid */
              <div className="grid md:grid-cols-2 gap-5">
                {filteredMarkets.map((market) => (
                  <MarketCard market={market} key={market.id} />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Real-time Ledger Ticker & AI Signals */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-5 sticky top-5 h-[calc(100vh-80px)] hidden lg:flex flex-col">
              
              {/* Tab Navigation header */}
              <div className="flex border-b border-border/60 pb-1.5 justify-between">
                <button
                  onClick={() => setSidebarTab('activity')}
                  className={`flex-1 pb-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 text-center transition-all duration-200 ${
                    sidebarTab === 'activity' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-white'
                  }`}
                >
                  Live Ledger
                </button>
                <button
                  onClick={() => setSidebarTab('ai-insights')}
                  className={`flex-1 pb-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 text-center transition-all duration-200 ${
                    sidebarTab === 'ai-insights' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-gray-500 hover:text-white'
                  }`}
                >
                  AI Signal Room
                </button>
              </div>

              {/* Ticker Content slots */}
              {sidebarTab === 'activity' ? (
                <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 text-xs">
                  {globalTrades.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-medium">
                      <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                      Waiting for market trades...
                    </div>
                  ) : (
                    globalTrades.map((t: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#181d2a]/80 border border-border/60 flex items-center justify-between gap-3 text-[11px] animate-fade-in hover:border-brand-accent/30 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <img
                            src={t.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'}
                            alt={t.username}
                            className="w-7 h-7 rounded-full object-cover border border-border shadow-sm flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                            <p className="font-bold text-white truncate">{t.username}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{t.marketTitle}</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className={`font-black font-heading ${t.side === 'YES' ? 'text-brand-yes' : 'text-brand-no'}`}>
                            {t.side}
                          </span>
                          <p className="text-[10px] text-white font-extrabold">₹{t.amount.toFixed(0)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* AI Signals Intelligence Hub */
                <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 text-xs">
                  <div className="p-3.5 rounded-xl bg-brand-accent/5 border border-brand-accent/15 space-y-2.5 text-center">
                    <Bot className="w-7 h-7 text-brand-accent mx-auto animate-bounce" />
                    <h4 className="text-xs font-bold text-white">Spotlight AI Core</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                      Aggregating public news streams, community sentiment gauges, and quantitative costs basis in real-time.
                    </p>
                  </div>

                  {featuredMarket && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-[#181d2a]/80 border border-border/60 space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          <span>Target Event</span>
                          <span className="text-brand-accent">{featuredMarket.category}</span>
                        </div>
                        <p className="font-bold text-white line-clamp-2">{featuredMarket.title}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#181d2a]/80 border border-border/60 space-y-2.5">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">AI Sentiment Breakdown</span>
                        <div className="flex items-center justify-between font-extrabold text-xs">
                          <span className="text-brand-yes">Bullish</span>
                          <span className="text-brand-accent">{(featuredMarket.aiConfidence || 50).toFixed(0)}% Confidence</span>
                        </div>
                        <div className="w-full bg-[#0b0e14] h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-brand-accent to-brand-yes h-full rounded-full" style={{ width: `${featuredMarket.aiConfidence || 50}%` }}></div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#181d2a]/80 border border-border/60 space-y-2">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Hot Consensus Driver</span>
                        <p className="text-[11px] text-gray-300 font-semibold leading-relaxed">
                          {featuredMarket.trendingNarrative}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[9px] text-gray-500 font-semibold bg-[#121620] border border-border/60 rounded-xl p-2.5 mt-2">
                    <ShieldCheck className="w-4 h-4 text-brand-yes" />
                    Fintech compliance signal checks active. Settle on official closing telemetry.
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0e14] text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-accent border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 font-semibold font-heading">Syncing with prediction grid...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
