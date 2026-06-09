'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Users, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const FeaturedSparkline = dynamic(() => import('./FeaturedSparkline'), { ssr: false });

interface MarketCardProps {
  market: any;
}

export default function MarketCard({ market }: MarketCardProps) {
  const yesPercent = Math.round((market.yesPrice || 0.5) * 100);
  
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!market.endDate) return '';
      const difference = +new Date(market.endDate) - +new Date();
      if (difference <= 0) return 'Closed';

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) {
        return `Closes in ${days}d ${hours}h`;
      }
      if (hours > 0) {
        return `Closes in ${hours}h ${minutes}m`;
      }
      return `Closes in ${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 30000); // Update every 30s

    return () => clearInterval(timer);
  }, [market.endDate]);

  // Generate mini mock sparkline trend data for the card
  const miniSparklineData = [
    { value: 0.5 },
    { value: 0.52 },
    { value: 0.49 },
    { value: 0.54 },
    { value: 0.58 },
    { value: market.yesPrice || 0.6 }
  ];

  // Mock a realistic trader count based on volume
  const traderCount = Math.floor((market.volume || 100) * 0.04) + 18;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-card border border-border/80 hover:border-brand-accent/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden shadow-sm hover:shadow-glow"
    >
      {/* Glowing horizontal header highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-accent/0 via-brand-accent/40 to-brand-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div>
        {/* Card Header Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-extrabold text-brand-accent px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20 font-heading uppercase tracking-wider">
              {market.category}
            </span>
            {timeLeft && (
              <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded font-heading uppercase tracking-wider">
                {timeLeft}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-semibold">
            <span className="flex h-1.5 w-1.5 rounded-full bg-brand-yes animate-pulse"></span>
            <span className="flex items-center gap-1 font-bold text-gray-400">
              <Users className="w-3 h-3 text-brand-accent" /> {traderCount} trading
            </span>
          </div>
        </div>

        {/* Title click through */}
        <Link href={`/market/${market.id}`} className="block mt-3.5 group-hover:text-brand-accent transition-colors duration-200">
          <h3 className="text-sm font-bold text-white font-heading leading-snug line-clamp-2 min-h-[40px]">
            {market.title}
          </h3>
        </Link>
        
        {/* Description brief */}
        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed min-h-[32px] font-semibold">
          {market.description}
        </p>

        {/* Mini Sparkline Chart */}
        <div className="flex items-center justify-between mt-3 py-1 border-t border-b border-border/40">
          <div className="w-20 h-6">
            <FeaturedSparkline data={miniSparklineData} />
          </div>
          <span className="text-[10px] font-bold text-gray-400">
            Volume: <span className="text-white font-extrabold">₹{(market.volume || 0).toLocaleString('en-IN')}</span>
          </span>
        </div>
      </div>

      {/* Pricing actions bottom */}
      <div className="mt-4 space-y-3.5">
        <div className="flex gap-2.5">
          <Link
            href={`/market/${market.id}?side=YES`}
            className="flex-1 bg-brand-yes/8 hover:bg-brand-yes/15 border border-brand-yes/30 py-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200 relative group/btn overflow-hidden"
          >
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">YES</span>
            <span className="text-sm font-black text-brand-yes">
              ₹{(market.yesPrice || 0.5).toFixed(2)}
            </span>
          </Link>
          
          <Link
            href={`/market/${market.id}?side=NO`}
            className="flex-1 bg-brand-no/8 hover:bg-brand-no/15 border border-brand-no/30 py-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200 relative group/btn overflow-hidden"
          >
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">NO</span>
            <span className="text-sm font-black text-brand-no">
              ₹{(market.noPrice || 0.5).toFixed(2)}
            </span>
          </Link>
        </div>

        {/* AI & Sentiment Telemetry */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold pt-1">
          <span className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            AI Confidence: <span className="text-white font-extrabold">{(market.aiConfidence || 50).toFixed(0)}%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              market.marketSentiment === 'Bullish' ? 'text-brand-yes bg-brand-yesMuted border border-brand-yes/15' : 
              market.marketSentiment === 'Bearish' ? 'text-brand-no bg-brand-noMuted border border-brand-no/15' : 'text-gray-400 bg-gray-400/10 border border-gray-400/20'
            }`}>
              {market.marketSentiment || 'Neutral'}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
