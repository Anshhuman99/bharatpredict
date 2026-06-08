'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import { useRouter } from 'next/navigation';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

export default function Wallet() {
  const { init, walletBalance, depositCash, withdrawCash, userId, isAuthenticated, isInitialized, token } = useWallet();
  const router = useRouter();
  const [walletDetails, setWalletDetails] = useState<any>(null);

  const [depositAmount, setDepositAmount] = useState<string>('1000');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [upiId, setUpiId] = useState<string>('anshuman@okaxis');
  
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const fetchLedger = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletDetails(data);
      }
    } catch (e) {
      console.error('Error fetching wallet ledger details:', e);
    }
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      fetchLedger();
    }
  }, [isInitialized, isAuthenticated, router]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setLedgerError('Please enter a valid deposit amount');
      return;
    }
    setLedgerError(null);
    setIsProcessingPay(true);

    try {
      const res = await depositCash(amt);
      if (res.success) {
        setDepositAmount('');
        fetchLedger();
      } else {
        setLedgerError(res.message || 'Deposit failed');
      }
    } catch (err: any) {
      setLedgerError(err.message || 'Server connection failed');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setLedgerError('Please enter a valid withdrawal amount');
      return;
    }

    if (amt > walletBalance) {
      setLedgerError('Insufficient wallet balance to process withdrawal');
      return;
    }

    setLedgerError(null);
    const res = await withdrawCash(amt);
    if (res.success) {
      setWithdrawAmount('');
      fetchLedger();
    } else {
      setLedgerError(res.message || 'Withdrawal failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-foreground flex">
      <Sidebar />

      <div className="flex-1 md:pl-64 pb-24 md:pb-8 flex flex-col">
        <MobileHeader />

        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h2 className="text-3xl font-extrabold font-heading text-white tracking-wide">
              INR Funds Manager
            </h2>
            <p className="text-xs text-muted font-medium mt-1">
              Add simulated INR using secure cryptographic Sandbox flows.
            </p>
          </div>

          <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden max-w-lg">
            <div className="absolute top-0 right-0 w-36 h-36 bg-brand-accent/5 rounded-full blur-2xl"></div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Available Trading Capital</span>
            <h3 className="text-3xl font-black text-white font-heading mt-2">
              ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-semibold bg-[#0b0e14] border border-border/60 rounded-xl p-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-yes" />
              Fully functional sandbox environment. Zero real fees or charges applied.
            </div>
          </div>

          {ledgerError && (
            <div className="p-3 bg-brand-noMuted border border-brand-no/20 rounded-xl max-w-lg flex items-start gap-2.5 text-xs text-brand-no font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{ledgerError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Deposit Desk */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2.5">
                <ArrowDownLeft className="w-5 h-5 text-brand-yes" /> Add Capital (Sandbox UPI)
              </h4>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                    Deposit Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-sm font-black text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl pl-8 pr-4 py-3.5 text-sm font-black text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {['500', '1000', '2500', '5000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepositAmount(val)}
                      className="flex-1 py-2 rounded-lg bg-[#0b0e14] hover:bg-[#181d2a] border border-border hover:border-brand-accent text-xs font-bold text-gray-300 transition-all duration-200"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isProcessingPay}
                  className="w-full py-3.5 rounded-xl bg-brand-yes hover:bg-green-600 shadow-glow text-white text-xs font-extrabold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  {isProcessingPay ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  ) : (
                    'ADD FUNDS INSTANTLY'
                  )}
                </button>
              </form>
            </div>

            {/* Withdraw Desk */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2.5">
                <ArrowUpRight className="w-5 h-5 text-brand-no" /> Instant Bank Settlement
              </h4>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                      Withdraw Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-sm font-black text-gray-500">₹</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl pl-8 pr-4 py-3.5 text-sm font-black text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">
                      Target UPI ID / IFSC
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. name@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-[#0b0e14] border border-border focus:border-brand-accent/50 outline-none rounded-xl px-4 py-3.5 text-sm font-bold text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-brand-no hover:bg-red-600 shadow-glow text-white text-xs font-extrabold uppercase tracking-widest transition-all duration-200"
                >
                  INITIATE WITHDRAWAL
                </button>
              </form>
            </div>

          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-border/40 pb-2">
              Transaction Ledger History
            </h3>

            {!walletDetails || !walletDetails.transactions || walletDetails.transactions.length === 0 ? (
              <div className="bg-[#121620]/60 border border-border/60 rounded-3xl p-12 text-center">
                <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-base font-bold text-white">No Transactions Recorded</h4>
                <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto">
                  Your funds transaction history is completely clean. Make deposits using our simulated UPI popups to see active records.
                </p>
              </div>
            ) : (
              <div className="bg-[#121620] border border-border rounded-2xl overflow-hidden shadow-lg text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-[#181d2a] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Ledger Type</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Status</th>
                      <th className="px-6 py-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-gray-300 font-medium">
                    {walletDetails.transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-[#181d2a]/30 transition-all duration-200">
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500">
                          {tx.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {tx.type}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          tx.type === 'DEPOSIT' || tx.type === 'SETTLEMENT' ? 'text-brand-yes' : 'text-brand-no'
                        }`}>
                          {tx.type === 'DEPOSIT' || tx.type === 'SETTLEMENT' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'SUCCESS' ? 'text-brand-yes bg-brand-yesMuted border border-brand-yes/20' : 'text-orange-500 bg-orange-500/10 border border-orange-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-400">
                          {new Date(tx.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
