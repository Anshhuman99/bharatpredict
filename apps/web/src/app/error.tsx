'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to telemetry
    console.error('Captured by global error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-no/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-no/10 border border-brand-no/25 flex items-center justify-center text-brand-no animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Text Header */}
        <div className="space-y-3">
          <h1 className="text-2xl font-black font-heading tracking-tight text-white">
            Telemetry Connection Error
          </h1>
          <p className="text-sm text-gray-400 font-semibold leading-relaxed max-w-sm mx-auto">
            An unexpected glitch occurred in our logarithmic market pricing calculations.
          </p>
        </div>

        {/* Error Code/Digest Details */}
        <div className="p-4 bg-card border border-border/80 rounded-2xl text-left space-y-2">
          <span className="text-[9px] font-extrabold text-brand-no px-2 py-0.5 rounded bg-brand-no/10 border border-brand-no/20 font-heading uppercase tracking-wider">
            Diagnostics
          </span>
          <p className="text-xs font-mono text-gray-400 break-all leading-normal">
            {error.message || 'Unknown execution trace'}
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-gray-500">
              Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-brand-accent text-white hover:bg-blue-600 shadow-glow transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset Execution
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider bg-card border border-border text-gray-300 hover:bg-card/85 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
