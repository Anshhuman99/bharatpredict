'use client';

import Link from 'next/link';
import { Compass, ArrowRight, CornerDownRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-no/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        
        {/* Brand/Logo Indicator */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-brand-no/10 border border-brand-no/20 text-brand-no text-xs font-black uppercase tracking-widest animate-pulse">
          <span className="w-2 h-2 rounded-full bg-brand-no"></span>
          <span>Error 404: Page Resolved to Null</span>
        </div>

        {/* 404 Header */}
        <div className="space-y-3">
          <h1 className="text-8xl font-black font-heading tracking-tighter bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl font-bold font-heading text-white">
            Outcome Unavailable
          </h2>
          <p className="text-sm text-gray-400 font-semibold leading-relaxed max-w-sm mx-auto">
            This route either never existed or has been settled and archived by the prediction controller.
          </p>
        </div>

        {/* Playful Mock Prediction Widget */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm text-left space-y-4">
          <div>
            <span className="text-[9px] font-extrabold text-brand-accent px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20 font-heading uppercase tracking-wider">
              System Telemetry
            </span>
            <h3 className="text-sm font-extrabold text-white mt-2 leading-snug">
              Will the user find the page they are looking for at this URL?
            </h3>
          </div>

          <div className="flex gap-2.5">
            <div className="flex-1 bg-brand-yes/5 border border-brand-yes/20 py-2.5 rounded-xl flex flex-col items-center justify-center opacity-60">
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">YES probability</span>
              <span className="text-sm font-black text-brand-yes">0.00%</span>
            </div>
            
            <div className="flex-1 bg-brand-no/10 border border-brand-no/40 py-2.5 rounded-xl flex flex-col items-center justify-center shadow-noGlow">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">NO probability</span>
              <span className="text-sm font-black text-brand-no">100.00%</span>
            </div>
          </div>
        </div>

        {/* Back Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-brand-accent text-white hover:bg-blue-600 shadow-glow transition-all duration-200 flex items-center justify-center gap-2"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-card border border-border text-gray-300 hover:bg-card/85 transition-all duration-200 block text-center"
          >
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
