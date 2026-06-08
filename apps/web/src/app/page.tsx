'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, TrendingUp, Compass, CheckCircle2, ShieldCheck, Award, Zap, Bot, Star } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { init, markets } = useWallet();
  const [activeSimulatorSide, setActiveSimulatorSide] = useState<'YES' | 'NO'>('YES');
  const [simulatorProbability, setSimulatorProbability] = useState<number>(64);
  const [simulatorQuantity, setSimulatorQuantity] = useState<string>('500');

  useEffect(() => {
    // Warm up the REST connection and Socket server
    init();
  }, []);

  const steps = [
    {
      title: '1. Select an Event',
      desc: 'Pick your sector: IPL matches, election outcomes, stock indexes, or movie earnings.',
      icon: Compass,
      color: 'text-blue-500'
    },
    {
      title: '2. Buy YES or NO',
      desc: 'If YES is priced at ₹0.62, the crowd believes there is a 62% chance of it happening. Buy shares to back your stance.',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: '3. Win Instant Settlement',
      desc: 'Correct predictions settle at ₹1.00 per share. Sell early to secure profits or hold until resolution.',
      icon: CheckCircle2,
      color: 'text-purple-500'
    },
  ];

  const handleSimulatorTrade = (side: 'YES' | 'NO') => {
    setActiveSimulatorSide(side);
    // Simulate probability shift when landing page user interacts
    if (side === 'YES') {
      setSimulatorProbability(prev => Math.min(prev + 3, 98));
    } else {
      setSimulatorProbability(prev => Math.max(prev - 3, 2));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      
      {/* Horizontal Bloomberg-style scrolling ticker bar at the very top */}
      {markets.length > 0 && (
        <div className="w-full bg-[#0e121a] border-b border-border/60 overflow-hidden py-2 relative z-20">
          <div className="animate-ticker flex space-x-12 whitespace-nowrap">
            {[...markets, ...markets, ...markets].map((m, idx) => {
              const yesPercent = Math.round((m.yesPrice || 0.5) * 100);
              return (
                <div key={idx} className="inline-flex items-center space-x-2 text-[10px] font-semibold">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20 text-brand-accent font-bold font-heading">
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

      {/* Visual background ambient glowing details */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[140px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Main Landing Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-border/40 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-accent to-indigo-600 flex items-center justify-center shadow-glow">
            <span className="font-heading font-bold text-white text-lg">🇮🇳</span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight tracking-wide">
              BharatPredict
            </h1>
            <p className="text-[9px] text-muted tracking-wider uppercase font-semibold">
              Trade India's Future
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#121620] border border-border/80 hover:bg-[#181d2a] hover:border-brand-accent/50 text-white transition-all duration-200"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-4 h-4 text-brand-accent" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        
        {/* Left Column: Heading & Pitch */}
        <div className="lg:col-span-3 space-y-6 text-left">
          <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> India's Premier Prediction Exchange
          </span>

          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight font-heading leading-tight bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">
            Trade What India Thinks
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl font-medium leading-relaxed">
            Predict IPL victories, election counts, NSE indexes, and Bollywood opening nets. Back your insights in a premium, zero-risk sandbox prediction market.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-brand-accent text-white hover:bg-blue-600 shadow-glow transition-all duration-200 flex items-center justify-center gap-2"
            >
              Start Predicting <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold bg-[#121620] border border-border text-gray-300 hover:bg-[#181d2a] transition-all duration-200 block text-center"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Right Column: Interactive Prediction Simulator Widget */}
        <div className="lg:col-span-2">
          <div className="relative bg-[#121620] border border-brand-accent/30 rounded-3xl p-6 shadow-glow overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-brand-yes animate-pulse" />
                Live Demo Simulator
              </h4>
              <span className="text-[9px] font-mono text-gray-500">LMSR AMM MODEL</span>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <span className="text-[10px] text-brand-accent font-bold uppercase tracking-wider">Active Event</span>
                <h3 className="text-sm font-extrabold text-white mt-1 leading-snug">
                  Will CSK win the IPL Final match tonight?
                </h3>
              </div>

              {/* Dynamic probability display dial */}
              <div className="p-3 bg-[#0b0e14] border border-border/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">YES Outcome Odds</span>
                  <span className="text-2xl font-black text-brand-yes mt-1 font-heading">{simulatorProbability}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase text-right">YES Share Price</span>
                  <span className="text-2xl font-black text-white mt-1 font-heading">₹{(simulatorProbability / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Interactive side buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulatorTrade('YES')}
                  className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                    activeSimulatorSide === 'YES' ? 'bg-brand-yes text-white shadow-yesGlow' : 'bg-[#0b0e14] text-gray-400 border border-border/60 hover:text-white'
                  }`}
                >
                  Buy YES
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatorTrade('NO')}
                  className={`flex-1 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                    activeSimulatorSide === 'NO' ? 'bg-brand-no text-white shadow-noGlow' : 'bg-[#0b0e14] text-gray-400 border border-border/60 hover:text-white'
                  }`}
                >
                  Buy NO
                </button>
              </div>

              {/* Dynamic shares estimator */}
              <div className="p-3 bg-[#0b0e14]/50 border border-border/50 rounded-xl space-y-1.5 text-[11px] font-semibold text-gray-400">
                <div className="flex justify-between">
                  <span>Investment amount</span>
                  <span className="text-white">₹{simulatorQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. YES Shares</span>
                  <span className="text-white">{(parseFloat(simulatorQuantity) / (simulatorProbability / 100)).toFixed(1)} Shares</span>
                </div>
                <div className="flex justify-between font-bold text-brand-yes border-t border-border/40 pt-1.5 mt-1.5">
                  <span>Max Winnings Settle Payout</span>
                  <span>₹{(parseFloat(simulatorQuantity) / (simulatorProbability / 100)).toFixed(0)}</span>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full py-3.5 bg-brand-accent hover:bg-blue-600 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider text-center block transition-all duration-200 shadow-glow"
              >
                Mirror Trade On Platform
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 border-t border-border/40 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h3 className="text-3xl font-bold font-heading text-white">
            How BharatPredict Works
          </h3>
          <p className="text-sm text-gray-400 mt-3 font-medium">
            Learn the core probabilistic concepts of event prediction in seconds.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-[#121620] border border-border/60 rounded-3xl p-8 hover:border-brand-accent/40 transition-all duration-300 relative group"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-accent/15 flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white font-heading">{s.title}</h4>
                <p className="text-sm text-gray-400 mt-3 font-medium leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-10 border-t border-border/40 relative z-10 space-y-12">
        <h3 className="text-center text-2xl font-bold text-white font-heading">
          Fintech-Grade Ecosystem Built for High Accuracy
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">AI Sentiment Analysis</h4>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Consolidates real-time comments, social telemetry, and quant variables to produce high confidence direction indicators.
            </p>
          </div>

          <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">LMSR Pricing Engine</h4>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Maintains stable, continuous-time logarithmic pricing calculations ensuring exact share estimation under all sandboxed liquidity parameters.
            </p>
          </div>

          <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Leaderboard & Mirror Trading</h4>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed">
              Track top predictor profiles. With one-click mirror allocation, mirror their predictions and earn simulated yields instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 border-t border-border/40 text-xs text-muted font-medium bg-[#080b0f] relative z-10">
        <p>© 2026 BharatPredict Exchange. Built with premium Fintech-grade architecture. Settle legally on official outcomes.</p>
        <p className="mt-1 text-[10px] text-muted-foreground">Disclaimer: This is a high-fidelity prototype simulating event probabilities for research purposes.</p>
      </footer>
    </div>
  );
}
