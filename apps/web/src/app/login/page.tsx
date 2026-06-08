'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '../../hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, User, Copy, Check, ArrowRight, ShieldAlert, Sparkles, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signup, login, isLoading } = useWallet();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassphrase, setLoginPassphrase] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  
  // Registration success state (passphrase display)
  const [generatedPassphrase, setGeneratedPassphrase] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUsername.trim() || !loginPassphrase.trim()) {
      setLoginError('Please enter both username and passphrase.');
      return;
    }

    const res = await login(loginUsername, loginPassphrase);
    if (res.success) {
      router.push('/dashboard');
    } else {
      setLoginError(res.message || 'Invalid username or passphrase.');
    }
  };

  const handleSignupInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupUsername.trim()) {
      setSignupError('Please enter a username.');
      return;
    }

    if (signupUsername.length < 3) {
      setSignupError('Username must be at least 3 characters long.');
      return;
    }

    const res = await signup(signupUsername);
    if (res.success && res.passphrase) {
      setGeneratedPassphrase(res.passphrase);
    } else {
      setSignupError(res.message || 'Failed to create account. Username might be taken.');
    }
  };

  const copyToClipboard = () => {
    if (!generatedPassphrase) return;
    navigator.clipboard.writeText(generatedPassphrase);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSavedConfirm = () => {
    // Already authenticated and logged in by signup() action. Redirect to dashboard.
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-[#0b0e14] text-foreground flex items-center justify-center p-6 overflow-hidden">
      {/* Background radial glow details */}
      <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-brand-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 right-1/3 w-[550px] h-[550px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Floating brand header */}
      <div className="absolute top-8 flex items-center space-x-3 select-none">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent to-indigo-600 flex items-center justify-center shadow-glow">
          <span className="font-heading font-bold text-white text-xl">🇮🇳</span>
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl leading-tight tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            BharatPredict
          </h1>
          <p className="text-[10px] text-muted tracking-wider uppercase font-semibold">
            Trade India's Future
          </p>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {!generatedPassphrase ? (
            <motion.div
              key="auth-tabs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-[#121620]/80 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              {/* Tab Selector */}
              <div className="flex bg-[#0b0e14] p-1.5 rounded-2xl border border-border/50">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError(null);
                  }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                    activeTab === 'login'
                      ? 'bg-brand-accent text-white shadow-glow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setActiveTab('signup');
                    setSignupError(null);
                  }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                    activeTab === 'signup'
                      ? 'bg-brand-accent text-white shadow-glow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Login Tab Content */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="Enter your username"
                        disabled={isLoading}
                        className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">5-Word Passphrase</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={loginPassphrase}
                        onChange={(e) => setLoginPassphrase(e.target.value)}
                        placeholder="word1-word2-word3-word4-word5"
                        disabled={isLoading}
                        className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-brand-no font-semibold"
                    >
                      ⚠️ {loginError}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-brand-accent hover:bg-brand-accent/90 disabled:bg-gray-700 disabled:text-gray-500 text-white font-extrabold uppercase text-xs tracking-wider rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-glow"
                  >
                    {isLoading ? 'Verifying Account...' : (
                      <>
                        <LogIn className="w-4 h-4" /> Secure Log In
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Signup Tab Content */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignupInit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Choose Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        placeholder="e.g. DhruvPredicts"
                        disabled={isLoading}
                        className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white transition-all font-semibold"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">Must be unique. Capitalization counts.</p>
                  </div>

                  {signupError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-brand-no font-semibold"
                    >
                      ⚠️ {signupError}
                    </motion.p>
                  )}

                  <div className="bg-[#0b0e14] rounded-2xl p-4 border border-border/40 text-[11px] text-gray-400 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Sparkles className="w-3.5 h-3.5 text-brand-accent" /> Welcoming Offer
                    </div>
                    <p>New members receive a free starting balance of **₹1,000.00** to instantly begin making predictions on sports, finance, and trends.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-brand-accent to-indigo-600 hover:opacity-95 disabled:bg-gray-700 disabled:text-gray-500 text-white font-extrabold uppercase text-xs tracking-wider rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-glow"
                  >
                    {isLoading ? 'Creating Wallet...' : (
                      <>
                        Generate Security Key <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            /* Passphrase Reveal Screen */
            <motion.div
              key="passphrase-reveal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-[#121620]/90 backdrop-blur-xl border border-brand-accent/30 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-brand-accent animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-white">Your Account Security Key</h2>
                <p className="text-xs text-gray-400 max-w-xs">
                  We generate cryptographic credentials. Copy and save this phrase. It is your only password!
                </p>
              </div>

              {/* Passphrase Copy Card */}
              <div className="relative group bg-[#0b0e14] border border-border rounded-2xl p-5 text-center font-mono text-sm tracking-wide text-white select-all">
                <div className="text-brand-accent font-extrabold uppercase text-[9px] tracking-widest absolute top-2.5 left-4">
                  MEMORABLE PASSPHRASE
                </div>
                <p className="mt-3 py-1 font-bold text-brand-accent/90">{generatedPassphrase}</p>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="absolute right-3.5 bottom-3.5 p-2 bg-[#121620] hover:bg-[#181d2a] border border-border/80 rounded-xl text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check className="w-4 h-4 text-brand-yes" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Urgent warning alert */}
              <div className="flex items-start gap-3 bg-brand-no/5 border border-brand-no/20 rounded-2xl p-4 text-[11px] text-gray-400">
                <ShieldAlert className="w-5 h-5 text-brand-no shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-brand-no uppercase tracking-wider">Crucial Warning</span>
                  <p>BharatPredict does not store this passphrase on our servers. If you lose this key, you lose access to your account and wallet balance forever.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavedConfirm}
                className="w-full py-4 bg-brand-yes text-[#0b0e14] hover:bg-brand-yes/90 font-extrabold uppercase text-xs tracking-wider rounded-2xl transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                I Have Saved It, Log Me In <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
