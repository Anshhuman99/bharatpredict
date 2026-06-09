'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useWallet } from '../../../hooks/useWallet';
import Sidebar from '../../../components/Sidebar';
import MobileHeader from '../../../components/MobileHeader';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import confetti from 'canvas-confetti';
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
  Link2,
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

const playChaChingSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Low chime tone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.1, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    // High chime tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08); // A5
    gain2.gain.setValueAtTime(0.1, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.35);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.error('Failed to play sound:', e);
  }
};

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

function CommentNode({
  comment,
  depth = 0,
  onReplySubmit,
  onVote,
  isAuthenticated,
  activeReplyId,
  setActiveReplyId,
  replyText,
  setReplyText,
  isSubmittingReply
}: {
  comment: any;
  depth?: number;
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  onVote: (commentId: string, value: number) => Promise<void>;
  isAuthenticated: boolean;
  activeReplyId: string | null;
  setActiveReplyId: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  isSubmittingReply: boolean;
}) {
  const score = comment.upvotes - comment.downvotes;

  return (
    <div className="space-y-3">
      {/* Comment Card */}
      <div 
        className={`relative rounded-xl p-4 flex gap-3 text-xs border transition-all duration-300 ${
          comment.user?.isExpert
            ? 'bg-[#1e1b12]/50 border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
            : 'bg-[#181d2a]/50 border-border/60 hover:border-border/80'
        }`}
        style={{ marginLeft: `${Math.min(depth * 16, 48)}px` }}
      >
        {comment.user?.isExpert && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black text-amber-500 uppercase tracking-wider">
            👑 Expert Take
          </div>
        )}

        {/* Voting column */}
        <div className="flex flex-col items-center gap-1 text-gray-500">
          <button 
            disabled={!isAuthenticated}
            onClick={() => onVote(comment.id, comment.myVote === 1 ? 0 : 1)}
            className={`hover:text-amber-500 transition-colors ${comment.myVote === 1 ? 'text-amber-500 scale-110' : ''}`}
            title="Upvote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <span className={`font-mono font-bold text-[10px] ${
            comment.myVote === 1 ? 'text-amber-500' : (comment.myVote === -1 ? 'text-blue-500' : 'text-gray-400')
          }`}>
            {score > 0 ? `+${score}` : score}
          </span>
          <button 
            disabled={!isAuthenticated}
            onClick={() => onVote(comment.id, comment.myVote === -1 ? 0 : -1)}
            className={`hover:text-blue-500 transition-colors ${comment.myVote === -1 ? 'text-blue-500 scale-110' : ''}`}
            title="Downvote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        {/* Avatar */}
        <Link href={`/profile/${comment.userId}`} className="flex-shrink-0">
          <img 
            src={comment.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60'}
            alt={comment.user?.username} 
            className="w-8 h-8 rounded-full object-cover border border-border" 
          />
        </Link>

        {/* Info & text */}
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/profile/${comment.userId}`} className="font-extrabold text-white hover:text-brand-accent transition-colors">
              {comment.user?.username}
            </Link>
            
            {/* User Level */}
            <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-brand-accent/10 border border-brand-accent/20 text-brand-accent uppercase tracking-wide">
              Lvl {comment.user?.level || 1}
            </span>
            
            {comment.user?.winRate > 0 && (
              <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-brand-yesMuted border border-brand-yes/20 text-brand-yes uppercase tracking-wide">
                {comment.user.winRate}% W/R
              </span>
            )}
            
            {comment.user?.currentStreak > 0 && (
              <span className="text-[8px] font-black px-1 py-0.2 rounded bg-orange-500/10 border border-orange-500/20 text-[#ff5722] uppercase tracking-wide">
                🔥 {comment.user.currentStreak}d
              </span>
            )}

            <span className="text-[9px] text-gray-500 ml-1">
              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p className="text-gray-300 font-semibold leading-relaxed">{comment.text}</p>

          {/* Actions */}
          {isAuthenticated && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  if (activeReplyId === comment.id) {
                    setActiveReplyId(null);
                  } else {
                    setActiveReplyId(comment.id);
                    setReplyText('');
                  }
                }}
                className="text-[10px] text-gray-500 hover:text-white font-extrabold flex items-center gap-1 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reply input field (indented) */}
      {activeReplyId === comment.id && (
        <div 
          className="flex gap-2"
          style={{ marginLeft: `${Math.min((depth + 1) * 16, 64)}px` }}
        >
          <input 
            type="text" 
            placeholder={`Reply to ${comment.user?.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-3 py-2 text-xs text-white"
          />
          <button
            onClick={() => onReplySubmit(comment.id, replyText)}
            disabled={isSubmittingReply || !replyText.trim()}
            className="bg-brand-accent hover:bg-blue-600 disabled:bg-gray-700 text-white px-4 rounded-xl text-xs font-bold transition-all"
          >
            Post
          </button>
        </div>
      )}

      {/* Replies (Recursive) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 relative">
          <div 
            className="absolute left-0 top-0 bottom-4 w-0.5 bg-border/40 hover:bg-brand-accent/30 transition-colors" 
            style={{ marginLeft: `${Math.min((depth * 16) + 24, 72)}px` }}
          />
          {comment.replies.map((reply: any) => (
            <CommentNode 
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReplySubmit={onReplySubmit}
              onVote={onVote}
              isAuthenticated={isAuthenticated}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              replyText={replyText}
              setReplyText={setReplyText}
              isSubmittingReply={isSubmittingReply}
            />
          ))}
        </div>
      )}
    </div>
  );
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

  // Thread replies state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        setTradeMode('BUY');
        setTradeSide('YES');
        const amtInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
        if (amtInput) amtInput.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setTradeMode('BUY');
        setTradeSide('NO');
        const amtInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement;
        if (amtInput) amtInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch market
  // ─────────────────────────────────────────────────────────────────────────

  const fetchDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/markets/${marketId}`);
      if (res.ok) {
        const data = await res.json();
        setMarket(data);
      }

      const commentsHeaders: Record<string, string> = {};
      if (token) {
        commentsHeaders['Authorization'] = `Bearer ${token}`;
      }
      const commentsRes = await fetch(`${API_URL}/markets/${marketId}/comments`, {
        headers: commentsHeaders
      });
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
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
  }, [token]);

  // WebSocket — new comments (handles threaded insert)
  useEffect(() => {
    if (!socket) return;
    socket.on(`new_comment_${marketId}`, (newComment: any) => {
      setComments((prev) => {
        const exists = (list: any[]): boolean => {
          return list.some(c => c.id === newComment.id || (c.replies && exists(c.replies)));
        };
        if (exists(prev)) return prev;

        if (!newComment.parentId) {
          return [newComment, ...prev];
        }

        const insertComment = (list: any[]): any[] => {
          return list.map(c => {
            if (c.id === newComment.parentId) {
              return { ...c, replies: [newComment, ...(c.replies || [])] };
            } else if (c.replies && c.replies.length > 0) {
              return { ...c, replies: insertComment(c.replies) };
            }
            return c;
          });
        };
        return insertComment(prev);
      });
    });
    return () => { socket.off(`new_comment_${marketId}`); };
  }, [socket, marketId]);

  const handleReplySubmit = async (parentId: string, text: string) => {
    if (!text.trim() || !token) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch(`${API_URL}/markets/${marketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, parentId })
      });
      if (res.ok) {
        const payload = await res.json();
        const createdComment = payload.success ? payload.data : payload;
        setComments((prev) => {
          const exists = (list: any[]): boolean => {
            return list.some(c => c.id === createdComment.id || (c.replies && exists(c.replies)));
          };
          if (exists(prev)) return prev;

          const insertComment = (list: any[]): any[] => {
            return list.map(c => {
              if (c.id === parentId) {
                return { ...c, replies: [createdComment, ...(c.replies || [])] };
              } else if (c.replies && c.replies.length > 0) {
                return { ...c, replies: insertComment(c.replies) };
              }
              return c;
            });
          };
          return insertComment(prev);
        });
        setActiveReplyId(null);
        setReplyText('');
      }
    } catch (e) {
      console.error('Failed to submit comment reply:', e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleVoteComment = async (commentId: string, value: number) => {
    if (!isAuthenticated || !token) return;
    try {
      setComments((prev) => {
        const updateVote = (list: any[]): any[] => {
          return list.map(c => {
            if (c.id === commentId) {
              const oldVote = c.myVote || 0;
              let newUp = c.upvotes;
              let newDown = c.downvotes;
              
              if (oldVote === 1) newUp--;
              else if (oldVote === -1) newDown--;
              
              if (value === 1) newUp++;
              else if (value === -1) newDown++;

              return {
                ...c,
                myVote: value !== 0 ? value : null,
                upvotes: newUp,
                downvotes: newDown
              };
            } else if (c.replies && c.replies.length > 0) {
              return { ...c, replies: updateVote(c.replies) };
            }
            return c;
          });
        };
        return updateVote(prev);
      });

      const res = await fetch(`${API_URL}/markets/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
      if (!res.ok) {
        fetchDetails();
      }
    } catch (e) {
      console.error('Failed to vote comment:', e);
      fetchDetails();
    }
  };

  const handleShare = (platform: 'twitter' | 'whatsapp') => {
    if (!market) return;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const yesProb = Math.round(spotYesPrice * 100);
    const text = `I just predicted YES on "${market.title}" with a probability of ${yesProb}%! Join me on BharatPredict to trade India's future:`;
    
    if (platform === 'twitter') {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`;
      window.open(url, '_blank');
    } else if (platform === 'whatsapp') {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + currentUrl)}`;
      window.open(url, '_blank');
    }
  };

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
      
      // Trigger animations and sounds
      playChaChingSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

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

      // Trigger animations and sounds
      playChaChingSound();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

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
        setComments((prev) => {
          const exists = (list: any[]): boolean => {
            return list.some(c => c.id === created.id || (c.replies && exists(c.replies)));
          };
          if (exists(prev)) return prev;
          return [created, ...prev];
        });
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
              <div className="bg-card border border-border/80 rounded-2xl p-6 relative overflow-hidden">
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

                  {/* Share buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleShare('twitter')}
                      className="p-1.5 rounded-lg bg-[#181d2a] border border-border/60 text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center"
                      title="Share to Twitter"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleShare('whatsapp')}
                      className="p-1.5 rounded-lg bg-[#181d2a] border border-border/60 text-gray-400 hover:text-green-500 hover:border-green-500/50 transition-colors flex items-center justify-center"
                      title="Share to WhatsApp"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.62.962 3.21 1.6 5.343 1.6 5.485 0 9.948-4.463 9.952-9.95.002-2.659-1.03-5.16-2.906-7.038C17.158 1.889 14.65 .857 12 0.857 6.52 0.857 2.057 5.32 2.053 10.8c-.001 2.03.535 4.02 1.55 5.795L2.628 20.25l3.966-1.042z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={handleCopyLink}
                      className="px-2.5 py-1.5 rounded-lg bg-[#181d2a] border border-border/60 text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider font-heading"
                      title="Copy Link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
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

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs font-medium">Be the first to share an insight!</div>
                  ) : (
                    comments.map((c: any) => (
                      <CommentNode
                        key={c.id}
                        comment={c}
                        onReplySubmit={handleReplySubmit}
                        onVote={handleVoteComment}
                        isAuthenticated={isAuthenticated}
                        activeReplyId={activeReplyId}
                        setActiveReplyId={setActiveReplyId}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        isSubmittingReply={isSubmittingReply}
                      />
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
