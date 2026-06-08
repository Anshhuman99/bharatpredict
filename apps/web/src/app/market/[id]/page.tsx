'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import Sidebar from '../../../components/Sidebar';
import MobileHeader from '../../../components/MobileHeader';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowLeft,
  Bot,
  MessageSquare,
  Send,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function CountdownTimer({ endDate }: { endDate: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Closed'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 48) {
        setRemaining(`${Math.floor(h / 24)}d ${h % 24}h`);
      } else {
        setRemaining(`${h}h ${m}m ${s}s`);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return <span>{remaining}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

function MarketDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const marketId = resolvedParams.id;
  const searchParams = useSearchParams();
  const initialSide = searchParams.get('side') === 'NO' ? 'NO' : 'YES';

  const { executeTrade, executeSell, socket, init, userId, username, avatar, isAuthenticated, token } = useWallet();
  const [market, setMarket] = useState<any>(null);

  // ── BUY state ──
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeSide, setTradeSide] = useState<'YES' | 'NO'>(initialSide);
  const [cashAmount, setCashAmount] = useState<string>('500');
  const [buyPreview, setBuyPreview] = useState<any>(null);
  const [buyPreviewError, setBuyPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState<any>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  // ── SELL state ──
  const [sellSide, setSellSide] = useState<'YES' | 'NO'>('YES');
  const [sellShares, setSellShares] = useState<string>('');
  const [sellPreview, setSellPreview] = useState<any>(null);
  const [sellPreviewError, setSellPreviewError] = useState<string | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  const [sellSuccess, setSellSuccess] = useState<any>(null);
  const [sellError, setSellError] = useState<string | null>(null);

  // ── Chart & comments ──
  const [chartMode, setChartMode] = useState<'LINE' | 'CANDLE'>('LINE');
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch market
  // ─────────────────────────────────────────────────────────────────────────

  const fetchDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/markets/${marketId}`);
      if (res.ok) {
        const data = await res.json();
        setMarket(data);
        if (data.comments) setComments(data.comments);
      }
    } catch (e) {
      console.error('Error fetching market details:', e);
    }
  };

  useEffect(() => {
    init();
    fetchDetails();
    const timer = setInterval(fetchDetails, 4000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket — new comments
  useEffect(() => {
    if (!socket) return;
    socket.on(`new_comment_${marketId}`, (newComment: any) => {
      setComments((prev) => prev.some((c) => c.id === newComment.id) ? prev : [newComment, ...prev]);
    });
    return () => { socket.off(`new_comment_${marketId}`); };
  }, [socket, marketId]);

  // ─────────────────────────────────────────────────────────────────────────
  // BUY preview (debounced)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!market || !cashAmount) { setBuyPreview(null); return; }
    const amt = parseFloat(cashAmount);
    if (isNaN(amt) || amt <= 0) { setBuyPreview(null); return; }

    const timer = setTimeout(async () => {
      try {
        setBuyPreviewError(null);
        const res = await fetch(`${API_URL}/trade/preview?marketId=${marketId}&side=${tradeSide}&amount=${cashAmount}`);
        if (res.ok) {
          const payload = await res.json();
          const preview = payload.success ? payload.data : payload;
          setBuyPreview(preview);
        } else {
          const err = await res.json().catch(() => ({}));
          setBuyPreviewError(err.message || 'Preview unavailable');
          setBuyPreview(null);
        }
      } catch {
        setBuyPreviewError('Preview temporarily unavailable. You can still trade.');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [cashAmount, tradeSide, marketId, market]);

  // ─────────────────────────────────────────────────────────────────────────
  // SELL preview (debounced)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!market || !sellShares) { setSellPreview(null); return; }
    const shares = parseFloat(sellShares);
    if (isNaN(shares) || shares <= 0) { setSellPreview(null); return; }

    const timer = setTimeout(async () => {
      if (!isAuthenticated || !token) {
        setSellPreview(null);
        return;
      }
      try {
        setSellPreviewError(null);
        const res = await fetch(
          `${API_URL}/trade/sell-preview?marketId=${marketId}&side=${sellSide}&shares=${sellShares}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (res.ok) {
          const payload = await res.json();
          const preview = payload.success ? payload.data : payload;
          setSellPreview(preview);
        } else {
          const err = await res.json().catch(() => ({}));
          setSellPreviewError(err.message || 'Preview unavailable');
          setSellPreview(null);
        }
      } catch {
        setSellPreviewError('Preview temporarily unavailable.');
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [sellShares, sellSide, marketId, market, token, isAuthenticated]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTradeError(null);
    setTradeSuccess(null);
    const amt = parseFloat(cashAmount);
    if (isNaN(amt) || amt <= 0) { setTradeError('Enter a valid amount'); setIsSubmitting(false); return; }
    const result = await executeTrade(marketId, tradeSide, amt);
    if (result.success) {
      setTradeSuccess(result);
      setCashAmount('');
      setBuyPreview(null);
      fetchDetails();
      setTimeout(() => setTradeSuccess(null), 8000);
    } else {
      setTradeError(result.message || 'Trade failed.');
    }
    setIsSubmitting(false);
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSelling(true);
    setSellError(null);
    setSellSuccess(null);
    const shares = parseFloat(sellShares);
    if (isNaN(shares) || shares <= 0) { setSellError('Enter a valid share amount'); setIsSelling(false); return; }
    const result = await executeSell(marketId, sellSide, shares);
    if (result.success) {
      setSellSuccess(result);
      setSellShares('');
      setSellPreview(null);
      fetchDetails();
      setTimeout(() => setSellSuccess(null), 8000);
    } else {
      setSellError(result.message || 'Sell failed.');
    }
    setIsSelling(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !token) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${API_URL}/markets/${marketId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newCommentText }),
      });
      if (res.ok) {
        const payload = await res.json();
        const created = payload.success ? payload.data : payload;
        setComments((prev) => prev.some((c) => c.id === created.id) ? prev : [created, ...prev]);
        setNewCommentText('');
      }
    } catch (e) {
      console.error('Comment error:', e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────

  if (!market) {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-accent border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 font-semibold">Syncing with quantitative engine...</p>
        </div>
      </div>
    );
  }

  const candlestickData = market.ohlcHistory?.map((c: any) => ({
    ...c,
    bodyRange: [c.open, c.close],
    wickRange: [c.low, c.high],
    color: c.close >= c.open ? '#00c853' : '#ff3d00',
  })) || [];

  const spotYesPrice = market.yesPrice ?? 0.5;
  const spotNoPrice = market.noPrice ?? 0.5;
  const isResolved = market.resolved;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
        <MobileHeader />

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-brand-accent gap-2.5">
            <ArrowLeft className="w-4 h-4" /> BACK TO DASHBOARD
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT: market info + chart + AI ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Header card */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-brand-accent px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">
                      {market.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Closes: <CountdownTimer endDate={market.endDate} />
                    </span>
                  </div>
                  {isResolved && (
                    <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                      market.outcome === 'YES'
                        ? 'text-brand-yes bg-brand-yesMuted border-brand-yes/30'
                        : 'text-brand-no bg-brand-noMuted border-brand-no/30'
                    }`}>
                      SETTLED — {market.outcome}
                    </span>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-extrabold font-heading text-white mt-4 leading-tight">
                  {market.title}
                </h2>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{market.description}</p>

                <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-border/40 text-center">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Volume</span>
                    <p className="text-base font-extrabold text-white mt-1">₹{market.volume.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">YES Price</span>
                    <p className="text-base font-extrabold text-brand-yes mt-1">₹{spotYesPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">NO Price</span>
                    <p className="text-base font-extrabold text-brand-no mt-1">₹{spotNoPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Price Probability Timeline</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Crowdsourced consensus progression</p>
                  </div>
                  <div className="flex bg-[#0b0e14] border border-border/60 p-1 rounded-xl">
                    {(['LINE', 'CANDLE'] as const).map((m) => (
                      <button key={m} onClick={() => setChartMode(m)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                          chartMode === m ? 'bg-brand-accent text-white shadow-glow' : 'text-gray-400 hover:text-white'
                        }`}>
                        {m === 'LINE' ? 'Line View' : 'Candlestick'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-64 md:h-80 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 'LINE' ? (
                      <ComposedChart data={market.priceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2633" />
                        <XAxis dataKey="time" stroke="#4b5563" />
                        <YAxis domain={[0, 1.0]} tickFormatter={(v) => `₹${v.toFixed(1)}`} stroke="#4b5563" />
                        <Tooltip contentStyle={{ backgroundColor: '#181d2a', borderColor: '#1e2530', borderRadius: '12px' }} labelStyle={{ color: '#828fbf', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="yesPrice" name="YES price" stroke="#00c853" strokeWidth={3} dot={false} />
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={candlestickData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2633" />
                        <XAxis dataKey="time" stroke="#4b5563" />
                        <YAxis domain={[0, 1.0]} tickFormatter={(v) => `₹${v.toFixed(1)}`} stroke="#4b5563" />
                        <Tooltip contentStyle={{ backgroundColor: '#181d2a', borderColor: '#1e2530', borderRadius: '12px' }} labelStyle={{ color: '#828fbf', fontWeight: 'bold' }} />
                        <Bar dataKey="wickRange" fill="#4b5563" barSize={2} opacity={0.6} />
                        <Bar dataKey="bodyRange" barSize={12}>
                          {candlestickData.map((entry: any, idx: number) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI insight cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
                  <div className="flex items-center space-x-2 text-brand-accent mb-3">
                    <Bot className="w-5 h-5" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">AI Confidence</span>
                  </div>
                  <h4 className="text-2xl font-black text-white font-heading">{(market.aiConfidence || 50).toFixed(0)}%</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Calculated using live social and quant telemetry.</p>
                </div>
                <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
                  <div className="flex items-center space-x-2 text-orange-500 mb-3">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">Lobby Sentiment</span>
                  </div>
                  <h4 className="text-2xl font-black text-white font-heading">{market.marketSentiment || 'Neutral'}</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Average consensus from active platform holdings.</p>
                </div>
                <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
                  <div className="flex items-center space-x-2 text-purple-500 mb-3">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">Key Driver</span>
                  </div>
                  <h4 className="text-xs font-bold text-white font-heading">{market.trendingNarrative || 'Standard volatility'}</h4>
                  <p className="text-[10px] text-gray-400 mt-2">Active consensus narratives trending on feeds.</p>
                </div>
              </div>

              {/* Comments */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-accent" />
                    Lobby Discussion ({comments.length})
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Real-time debate and opinion sharing on this outcome</p>
                </div>

                {isAuthenticated ? (
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <input type="text" placeholder="Back your claims. Share your insights..."
                      value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white" />
                    <button type="submit" disabled={isSubmittingComment || !newCommentText.trim()}
                      className="bg-brand-accent hover:bg-blue-600 disabled:bg-gray-700 text-white px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors duration-200">
                      <Send className="w-3.5 h-3.5" /> Post
                    </button>
                  </form>
                ) : (
                  <div className="bg-[#0b0e14] border border-border/40 rounded-2xl p-5 text-center">
                    <p className="text-xs text-gray-400 font-semibold mb-3">Sign in to join the conversation and share your insights!</p>
                    <Link href="/login" className="inline-block px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-glow">
                      Join Discussion
                    </Link>
                  </div>
                )}

                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs font-medium">Be the first to share an insight!</div>
                  ) : (
                    comments.map((c: any) => (
                      <div key={c.id} className="bg-[#181d2a]/50 border border-border/60 rounded-xl p-4 flex gap-3 text-xs">
                        <img src={c.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60'}
                          alt={c.user?.username} className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{c.user?.username}</span>
                            <span className="text-[9px] text-gray-500">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-300 font-semibold leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Trade Desk ── */}
            <div className="space-y-6">
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 sticky top-5 shadow-lg">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 border-b border-border/40 pb-2 flex items-center justify-between">
                  <span>Trade Desk</span>
                  <span className="text-[10px] text-gray-500">LMSR AMM</span>
                </h3>

                {/* ── RESOLVED BANNER ── */}
                {isResolved ? (
                  <div className={`rounded-2xl p-5 text-center space-y-3 border ${
                    market.outcome === 'YES'
                      ? 'bg-brand-yesMuted border-brand-yes/30'
                      : 'bg-brand-noMuted border-brand-no/30'
                  }`}>
                    <CheckCircle2 className={`w-10 h-10 mx-auto ${market.outcome === 'YES' ? 'text-brand-yes' : 'text-brand-no'}`} />
                    <h4 className="font-black text-white text-base">Market Settled</h4>
                    <p className={`text-sm font-extrabold ${market.outcome === 'YES' ? 'text-brand-yes' : 'text-brand-no'}`}>
                      Outcome: {market.outcome}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                      All winning {market.outcome} shares settled at ₹1.00 per share. Payouts credited to wallets.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ── BUY / SELL mode toggle ── */}
                    <div className="flex gap-2 p-1 bg-[#0b0e14] rounded-xl border border-border/60 mb-4">
                      <button
                        onClick={() => { setTradeMode('BUY'); setTradeError(null); setTradeSuccess(null); }}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                          tradeMode === 'BUY'
                            ? 'bg-brand-accent text-white shadow-glow'
                            : 'text-gray-400 hover:text-white'
                        }`}>
                        <ArrowUpRight className="w-3.5 h-3.5" /> BUY
                      </button>
                      <button
                        onClick={() => { setTradeMode('SELL'); setSellError(null); setSellSuccess(null); }}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                          tradeMode === 'SELL'
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}>
                        <ArrowDownLeft className="w-3.5 h-3.5" /> SELL
                      </button>
                    </div>

                    {/* ─────────── BUY PANEL ─────────── */}
                    {tradeMode === 'BUY' && (
                      <>
                        <div className="flex gap-2 p-1 bg-[#0b0e14] rounded-xl border border-border/60">
                          {(['YES', 'NO'] as const).map((s) => (
                            <button key={s} onClick={() => setTradeSide(s)}
                              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                                tradeSide === s
                                  ? s === 'YES' ? 'bg-brand-yes text-white shadow-yesGlow' : 'bg-brand-no text-white shadow-noGlow'
                                  : 'text-gray-400 hover:text-white'
                              }`}>
                              {s} (₹{s === 'YES' ? spotYesPrice.toFixed(2) : spotNoPrice.toFixed(2)})
                            </button>
                          ))}
                        </div>

                        <form onSubmit={handleBuySubmit} className="mt-5 space-y-4">
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                              Investment Amount (INR)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-3 text-sm font-black text-gray-500">₹</span>
                              <input type="number" placeholder="0.00" value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl pl-8 pr-4 py-3 text-sm font-black text-white" />
                            </div>
                          </div>

                          {buyPreview && (
                            <div className="bg-[#0b0e14] rounded-xl p-3.5 border border-border/60 space-y-2 text-xs font-medium">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Estimated Shares</span>
                                <span className="font-extrabold text-white">{buyPreview.shares.toFixed(2)} Shares</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Avg Share Price</span>
                                <span className="font-extrabold text-white">₹{buyPreview.avgPrice.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Platform Fee (1%)</span>
                                <span className="font-extrabold text-orange-400">-₹{buyPreview.fee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-border/40 font-bold">
                                <span className="text-brand-accent">Max Settlement Payout</span>
                                <span className="text-brand-yes">₹{buyPreview.shares.toFixed(0)}</span>
                              </div>
                            </div>
                          )}

                          {buyPreviewError && (
                            <div className="p-3 bg-brand-accent/5 border border-brand-accent/15 rounded-xl flex items-start gap-2.5 text-xs text-gray-400">
                              <Info className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                              <span>{buyPreviewError}</span>
                            </div>
                          )}

                          {tradeError && (
                            <div className="p-3 bg-brand-noMuted border border-brand-no/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-no">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{tradeError}</span>
                            </div>
                          )}

                          {tradeSuccess && (
                            <div className="p-3 bg-brand-yesMuted border border-brand-yes/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-yes">
                              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">Trade Confirmed!</p>
                                <p className="text-[10px] mt-0.5">Bought {tradeSuccess.sharesBought?.toFixed(2)} {tradeSide} shares at ₹{tradeSuccess.avgPrice?.toFixed(2)}</p>
                              </div>
                            </div>
                          )}

                          {isAuthenticated ? (
                            <button type="submit" disabled={isSubmitting || !cashAmount || parseFloat(cashAmount) <= 0}
                              className={`w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-glow transition-all duration-200 ${
                                tradeSide === 'YES' ? 'bg-brand-yes hover:bg-green-600' : 'bg-brand-no hover:bg-red-600'
                              } disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed`}>
                              {isSubmitting ? 'Verifying with AMM...' : `CONFIRM BUY ${tradeSide}`}
                            </button>
                          ) : (
                            <Link href="/login"
                              className="w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-brand-accent hover:bg-brand-accent/90 block text-center shadow-glow transition-all duration-200">
                              SIGN IN TO PLACE TRADE
                            </Link>
                          )}
                        </form>
                      </>
                    )}

                    {/* ─────────── SELL PANEL ─────────── */}
                    {tradeMode === 'SELL' && (
                      <>
                        <div className="p-3 bg-orange-500/5 border border-orange-500/15 rounded-xl text-[10px] text-orange-400 font-semibold mb-4">
                          Sell your shares back to the AMM at the current market price. A 1% platform fee applies.
                        </div>

                        <div className="flex gap-2 p-1 bg-[#0b0e14] rounded-xl border border-border/60">
                          {(['YES', 'NO'] as const).map((s) => (
                            <button key={s} onClick={() => { setSellSide(s); setSellShares(''); setSellPreview(null); }}
                              className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                                sellSide === s
                                  ? s === 'YES' ? 'bg-brand-yes text-white' : 'bg-brand-no text-white'
                                  : 'text-gray-400 hover:text-white'
                              }`}>
                              Sell {s} Shares
                            </button>
                          ))}
                        </div>

                        <form onSubmit={handleSellSubmit} className="mt-5 space-y-4">
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                              Shares to Sell
                              {sellPreview && <span className="ml-2 text-brand-accent normal-case font-semibold">(You own {sellPreview.ownedShares?.toFixed(2)})</span>}
                            </label>
                            <input type="number" placeholder="e.g. 50" value={sellShares}
                              onChange={(e) => setSellShares(e.target.value)}
                              step="0.01" min="0"
                              className="w-full bg-[#0b0e14] border border-border focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm font-black text-white" />
                            {sellPreview && (
                              <button type="button" onClick={() => setSellShares(sellPreview.ownedShares?.toFixed(2) ?? '')}
                                className="mt-1.5 text-[10px] text-brand-accent font-bold hover:text-white transition-colors">
                                Sell all {sellPreview.ownedShares?.toFixed(2)} shares →
                              </button>
                            )}
                          </div>

                          {sellPreview && sellPreview.netCash > 0 && (
                            <div className="bg-[#0b0e14] rounded-xl p-3.5 border border-orange-500/20 space-y-2 text-xs font-medium">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Gross Cash Received</span>
                                <span className="font-extrabold text-white">₹{sellPreview.cashReceived.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Platform Fee (1%)</span>
                                <span className="font-extrabold text-orange-400">-₹{sellPreview.fee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Avg Sell Price</span>
                                <span className="font-extrabold text-white">₹{sellPreview.avgSellPrice.toFixed(3)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-orange-500/20 font-bold">
                                <span className="text-orange-400">Net Cash to Wallet</span>
                                <span className="text-white">₹{sellPreview.netCash.toFixed(2)}</span>
                              </div>
                            </div>
                          )}

                          {sellPreviewError && (
                            <div className="p-3 bg-brand-noMuted border border-brand-no/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-no">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{sellPreviewError}</span>
                            </div>
                          )}

                          {sellError && (
                            <div className="p-3 bg-brand-noMuted border border-brand-no/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-no">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{sellError}</span>
                            </div>
                          )}

                          {sellSuccess && (
                            <div className="p-3 bg-orange-500/10 border border-orange-500/25 rounded-xl flex items-start gap-2.5 text-xs text-orange-400">
                              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">Sell Confirmed!</p>
                                <p className="text-[10px] mt-0.5">Sold {sellSuccess.sharesSold?.toFixed(2)} shares — ₹{sellSuccess.netCash?.toFixed(2)} credited to wallet</p>
                              </div>
                            </div>
                          )}

                          {isAuthenticated ? (
                            <button type="submit" disabled={isSelling || !sellShares || parseFloat(sellShares) <= 0}
                              className="w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200">
                              {isSelling ? 'Processing Exit...' : `SELL ${sellSide} SHARES`}
                            </button>
                          ) : (
                            <Link href="/login"
                              className="w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-brand-accent hover:bg-brand-accent/90 block text-center shadow-glow transition-all duration-200">
                              SIGN IN TO PLACE TRADE
                            </Link>
                          )}
                        </form>
                      </>
                    )}

                    <div className="mt-5 p-3 rounded-xl bg-brand-accent/5 border border-brand-accent/15 flex items-start gap-2.5 text-[10px] text-gray-400 leading-relaxed font-semibold">
                      <Info className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                      <span>Resolution based on official NSE / IPL records. Settlement within hours of event close.</span>
                    </div>
                  </>
                )}
              </div>

              {/* Order Book */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 text-xs">
                <h4 className="font-extrabold text-white uppercase tracking-wider mb-4 border-b border-border/40 pb-2">Order Book</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-brand-yes mb-2 text-[10px] uppercase">Bids (Buy)</h5>
                    <div className="space-y-1.5 font-mono">
                      {market.orderbook?.bids?.map((bid: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-gray-400">
                          <span>₹{bid.price.toFixed(2)}</span>
                          <span className="text-white font-bold">{bid.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-brand-no mb-2 text-[10px] uppercase">Asks (Sell)</h5>
                    <div className="space-y-1.5 font-mono">
                      {market.orderbook?.asks?.map((ask: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-gray-400">
                          <span>₹{ask.price.toFixed(2)}</span>
                          <span className="text-white font-bold">{ask.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default function MarketDetail({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0e14] text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-accent border-t-transparent animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 font-semibold font-heading">Syncing with quantitative engine...</p>
        </div>
      </div>
    }>
      <MarketDetailContent params={params} />
    </Suspense>
  );
}
