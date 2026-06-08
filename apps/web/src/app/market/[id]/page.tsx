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
  Clock,
  Sparkles,
  ArrowLeft,
  Bot,
  MessageSquare,
  Send,
  Sliders,
  TrendingUp as TrendLineIcon
} from 'lucide-react';

interface Params {
  id: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

function MarketDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const marketId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSide = searchParams.get('side') === 'NO' ? 'NO' : 'YES';

  const { executeTrade, socket, init, userId, username, avatar } = useWallet();
  const [market, setMarket] = useState<any>(null);
  const [tradeSide, setTradeSide] = useState<'YES' | 'NO'>(initialSide);
  const [cashAmount, setCashAmount] = useState<string>('500'); // Default ₹500
  const [calculatedShares, setCalculatedShares] = useState<number>(0);
  const [avgPrice, setAvgPrice] = useState<number>(0.5);
  const [slippage, setSlippage] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState<any>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  // New Features States
  const [chartMode, setChartMode] = useState<'LINE' | 'CANDLE'>('LINE');
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Fetch specific market details and comments
  const fetchDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/markets/${marketId}`);
      if (res.ok) {
        const data = await res.json();
        setMarket(data);
        if (data.comments) {
          setComments(data.comments);
        }
      }
    } catch (e) {
      console.error('Error fetching market details:', e);
    }
  };

  useEffect(() => {
    init();
    fetchDetails();

    // Set up local polling fallback for market metrics
    const timer = setInterval(() => {
      fetchDetails();
    }, 4000);

    return () => clearInterval(timer);
  }, [marketId]);

  // Connect WebSocket listeners for comments
  useEffect(() => {
    if (socket) {
      socket.on(`new_comment_${marketId}`, (newComment: any) => {
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) {
            return prev;
          }
          return [newComment, ...prev];
        });
      });

      return () => {
        socket.off(`new_comment_${marketId}`);
      };
    }
  }, [socket, marketId]);

  // Recalculate LMSR shares dynamically using the backend single source of truth
  useEffect(() => {
    if (!market || !cashAmount) {
      setCalculatedShares(0);
      setPreviewError(null);
      return;
    }

    const amt = parseFloat(cashAmount);
    if (isNaN(amt) || amt <= 0) {
      setCalculatedShares(0);
      setPreviewError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setPreviewError(null);
        const res = await fetch(
          `${API_URL}/trade/preview?marketId=${marketId}&side=${tradeSide}&amount=${cashAmount}`
        );
        if (res.ok) {
          const payload = await res.json();
          if (payload.success && payload.data) {
            const preview = payload.data;
            setCalculatedShares(preview.shares);
            setAvgPrice(preview.avgPrice);
            setSlippage(preview.slippage * 100);
          } else {
            setPreviewError(payload.message || 'Failed to fetch trade preview');
          }
        } else {
          const errPayload = await res.json().catch(() => ({}));
          setPreviewError(errPayload.message || 'Failed to fetch trade preview');
        }
      } catch (e) {
        console.error('Error fetching trade preview:', e);
        setPreviewError('Preview temporarily unavailable. You can still trade.');
      }
    }, 200); // 200ms debounce to prevent hitting the server on every keypress!

    return () => clearTimeout(timer);

  }, [cashAmount, tradeSide, marketId, market]);

  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTradeError(null);
    setTradeSuccess(null);

    const amt = parseFloat(cashAmount);
    if (isNaN(amt) || amt <= 0) {
      setTradeError('Please enter a valid INR amount');
      setIsSubmitting(false);
      return;
    }

    const result = await executeTrade(marketId, tradeSide, amt);
    if (result.success) {
      setTradeSuccess(result);
      setCashAmount('');
      fetchDetails(); 
      setTimeout(() => setTradeSuccess(null), 8000);
    } else {
      setTradeError(result.message || 'Trade execution failed.');
    }
    setIsSubmitting(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setIsSubmittingComment(true);

    try {
      const res = await fetch(`${API_URL}/markets/${marketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          text: newCommentText,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        const createdComment = payload.success ? payload.data : payload;
        setComments((prev) => {
          if (prev.some((c) => c.id === createdComment.id)) {
            return prev;
          }
          return [createdComment, ...prev];
        });
        setNewCommentText('');
      } else {
        console.error('Failed to post comment');
      }
    } catch (e) {
      console.error('Comment submission error:', e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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

  // Prepare Candlestick data for Recharts composed chart
  const candlestickData = market.ohlcHistory?.map((candle: any) => ({
    ...candle,
    // Bar coordinates [open, close] for body
    bodyRange: [candle.open, candle.close],
    // Bar coordinates [low, high] for wicks
    wickRange: [candle.low, candle.high],
    color: candle.close >= candle.open ? '#00c853' : '#ff3d00',
  })) || [];

  const spotYesPrice = market.yesPrice;
  const spotNoPrice = market.noPrice;

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
            
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-brand-accent px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20">
                      {market.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Closes: {new Date(market.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-bold">Resolution: NSE/IPL records</span>
                </div>

                <h2 className="text-xl md:text-2xl font-extrabold font-heading text-white mt-4 leading-tight">
                  {market.title}
                </h2>
                
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {market.description}
                </p>

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

              {/* Chart Plot Panel with Candlestick toggle */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Price Probability Timeline
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Crowdsourced consensus progression</p>
                  </div>

                  {/* Chart Style Toggle button */}
                  <div className="flex bg-[#0b0e14] border border-border/60 p-1 rounded-xl">
                    <button
                      onClick={() => setChartMode('LINE')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                        chartMode === 'LINE'
                          ? 'bg-brand-accent text-white shadow-glow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Line View
                    </button>
                    <button
                      onClick={() => setChartMode('CANDLE')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                        chartMode === 'CANDLE'
                          ? 'bg-brand-accent text-white shadow-glow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Candlestick View
                    </button>
                  </div>
                </div>

                <div className="h-64 md:h-80 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 'LINE' ? (
                      <ComposedChart data={market.priceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2633" />
                        <XAxis dataKey="time" stroke="#4b5563" />
                        <YAxis domain={[0, 1.0]} tickFormatter={(v) => `₹${v.toFixed(1)}`} stroke="#4b5563" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#181d2a', borderColor: '#1e2530', borderRadius: '12px' }}
                          labelStyle={{ color: '#828fbf', fontWeight: 'bold' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="yesPrice"
                          name="YES price"
                          stroke="#00c853"
                          strokeWidth={3}
                          dot={false}
                        />
                      </ComposedChart>
                    ) : (
                      /* Candlestick Composed Chart rendering wicks and bodies cleanly */
                      <ComposedChart data={candlestickData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2633" />
                        <XAxis dataKey="time" stroke="#4b5563" />
                        <YAxis domain={[0, 1.0]} tickFormatter={(v) => `₹${v.toFixed(1)}`} stroke="#4b5563" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#181d2a', borderColor: '#1e2530', borderRadius: '12px' }}
                          labelStyle={{ color: '#828fbf', fontWeight: 'bold' }}
                        />
                        {/* 1. Wick [L, H] Thin Bar */}
                        <Bar dataKey="wickRange" fill="#4b5563" barSize={2} opacity={0.6} />
                        {/* 2. Body [O, C] Thicker Floating Bar */}
                        <Bar dataKey="bodyRange" barSize={12}>
                          {candlestickData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI & Insight cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
                  <div className="flex items-center space-x-2 text-brand-accent mb-3">
                    <Bot className="w-5 h-5" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">AI Confidence</span>
                  </div>
                  <h4 className="text-2xl font-black text-white font-heading">
                    {(market.aiConfidence || 50).toFixed(0)}%
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1">Calculated using live social and quant telemetry.</p>
                </div>

                <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
                  <div className="flex items-center space-x-2 text-orange-500 mb-3">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">Lobby Sentiment</span>
                  </div>
                  <h4 className="text-2xl font-black text-white font-heading">
                    {market.marketSentiment || 'Neutral'}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-1">Average consensus weight from active platform holdings.</p>
                </div>

                <div className="bg-[#121620] border border-border/80 rounded-2xl p-5">
                  <div className="flex items-center space-x-2 text-purple-500 mb-3">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">Key Driver</span>
                  </div>
                  <h4 className="text-xs font-bold text-white font-heading truncate">
                    {market.trendingNarrative || 'Standard volatility'}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-2">Active consensus narratives trending on feeds.</p>
                </div>
              </div>

              {/* Interactive community discussions forum */}
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-brand-accent" />
                    Lobby Discussion ({comments.length})
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Real-time debate and opinion sharing on this outcome</p>
                </div>

                {/* Comment Input Desk */}
                <form onSubmit={handleCommentSubmit} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Back your claims. Share your insights..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newCommentText.trim()}
                    className="bg-brand-accent hover:bg-blue-600 disabled:bg-gray-700 text-white px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors duration-200"
                  >
                    <Send className="w-3.5 h-3.5" /> Post
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs font-medium">
                      Be the first to share an insight under this event!
                    </div>
                  ) : (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="bg-[#181d2a]/50 border border-border/60 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
                        <img
                          src={comment.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60'}
                          alt={comment.user?.username}
                          className="w-8 h-8 rounded-full object-cover border border-border shadow-sm flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{comment.user?.username}</span>
                            <span className="text-[9px] text-gray-500">
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-gray-300 font-semibold">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Trading panel */}
            <div className="space-y-6">
              
              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 sticky top-5 shadow-lg">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 border-b border-border/40 pb-2 flex items-center justify-between">
                  <span>Trade Desk</span>
                  <span className="text-[10px] text-gray-500">LMSR AMM</span>
                </h3>

                <div className="flex gap-2 p-1 bg-[#0b0e14] rounded-xl border border-border/60">
                  <button
                    onClick={() => setTradeSide('YES')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                      tradeSide === 'YES'
                        ? 'bg-brand-yes text-white shadow-yesGlow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    YES (₹{spotYesPrice.toFixed(2)})
                  </button>
                  <button
                    onClick={() => setTradeSide('NO')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${
                      tradeSide === 'NO'
                        ? 'bg-brand-no text-white shadow-noGlow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    NO (₹{spotNoPrice.toFixed(2)})
                  </button>
                </div>

                <form onSubmit={handleTradeSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                      Investment Amount (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-sm font-black text-gray-500">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl pl-8 pr-4 py-3 text-sm font-black text-white"
                      />
                    </div>
                  </div>

                  {calculatedShares > 0 && (
                    <div className="bg-[#0b0e14] rounded-xl p-3.5 border border-border/60 space-y-2 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated Shares</span>
                        <span className="font-extrabold text-white">{calculatedShares.toFixed(2)} Shares</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Average Share Price</span>
                        <span className="font-extrabold text-white">₹{avgPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expected Slippage</span>
                        <span className={`font-extrabold ${slippage > 2 ? 'text-orange-500' : 'text-brand-yes'}`}>
                          {slippage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border/40 font-bold">
                        <span className="text-brand-accent">Potential Payout</span>
                        <span className="text-brand-yes">₹{calculatedShares.toFixed(0)}</span>
                      </div>
                    </div>
                  )}

                  {previewError && (
                    <div className="p-3 bg-brand-accent/5 border border-brand-accent/15 rounded-xl flex items-start gap-2.5 text-xs text-gray-400 leading-relaxed font-semibold">
                      <Info className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                      <span>{previewError}</span>
                    </div>
                  )}

                  {tradeError && (
                    <div className="p-3 bg-brand-noMuted border border-brand-no/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-no leading-relaxed">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{tradeError}</span>
                    </div>
                  )}

                  {tradeSuccess && (
                    <div className="p-3 bg-brand-yesMuted border border-brand-yes/25 rounded-xl flex items-start gap-2.5 text-xs text-brand-yes leading-relaxed">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Trade Success!</p>
                        <p className="text-[10px] mt-0.5">Purchased {tradeSuccess.sharesBought.toFixed(2)} shares at avg. price ₹{tradeSuccess.avgPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || (calculatedShares <= 0 && !previewError) || !cashAmount || parseFloat(cashAmount) <= 0}
                    className={`w-full py-4 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white shadow-glow transition-all duration-200 ${
                      tradeSide === 'YES' ? 'bg-brand-yes hover:bg-green-600' : 'bg-brand-no hover:bg-red-600'
                    } disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? 'Verifying with AMM...' : `CONFIRM ${tradeSide} TRADE`}
                  </button>
                </form>

                <div className="mt-5 p-3 rounded-xl bg-brand-accent/5 border border-brand-accent/15 flex items-start gap-2.5 text-[10px] text-gray-400 leading-relaxed font-semibold">
                  <Info className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
                  <span>
                    Resolution Source: Settle based on NSE / IPL official match records. Settlement occurs legally within hours of event closing.
                  </span>
                </div>
              </div>

              <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 text-xs">
                <h4 className="font-extrabold text-white uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                  Order Book
                </h4>

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
