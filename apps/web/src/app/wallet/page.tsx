'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
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
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

export default function Wallet() {
  const { init, walletBalance, withdrawCash, userId } = useWallet();
  const [walletDetails, setWalletDetails] = useState<any>(null);

  const [depositAmount, setDepositAmount] = useState<string>('1000');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [upiId, setUpiId] = useState<string>('anshuman@okaxis');
  
  // UPI QR Code Popup Modal states
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [ledgerError, setLedgerError] = useState<string | null>(null);

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet?userId=${userId}`);
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
    fetchLedger();
  }, []);

  const handleDepositClick = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setLedgerError('Please enter a valid deposit amount');
      return;
    }
    setLedgerError(null);
    setIsProcessingPay(true);

    try {
      // 1. Call Backend Order API to create a pending payment transaction
      const res = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: amt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActiveOrder(data);
        setShowUpiModal(true);
        setPaymentSuccess(false);
      } else {
        setLedgerError(data.message || 'Order creation failed');
      }
    } catch (err: any) {
      setLedgerError(err.message || 'Server connection failed');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handleSimulatedPayment = async () => {
    if (!activeOrder) return;
    setIsProcessingPay(true);
    setLedgerError(null);

    try {
      // 1. Request the cryptographic Webhook payload (HMAC SHA256)
      const simRes = await fetch(`${API_URL}/payments/simulate-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          amount: parseFloat(depositAmount),
          userId,
        }),
      });

      const simData = await simRes.json();
      if (!simRes.ok) throw new Error('Simulation payload generation failed');

      // 2. Deliver the cryptographically signed Webhook to the webhook receiver!
      const webhookRes = await fetch(`${API_URL}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': simData.signature, // Cryptographic header!
        },
        body: JSON.stringify(simData.payload),
      });

      const webhookResult = await webhookRes.json();
      if (!webhookRes.ok) {
        throw new Error(webhookResult.message || 'Webhook verification failed');
      }

      // Simulate a network response latency
      setTimeout(() => {
        setIsProcessingPay(false);
        setPaymentSuccess(true);
        fetchLedger(); // refresh local ledger table
        
        setTimeout(() => {
          setShowUpiModal(false);
          setPaymentSuccess(false);
          setActiveOrder(null);
        }, 2200);
      }, 1500);

    } catch (err: any) {
      setIsProcessingPay(false);
      setLedgerError(err.message || 'Simulated payment processing failed');
      setShowUpiModal(false);
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

              <form onSubmit={handleDepositClick} className="space-y-4">
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
                    <>
                      <QrCode className="w-4 h-4" /> GENERATE SANDBOX QR
                    </>
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

      {/* 3. Sandbox UPI Checkout Modal */}
      {showUpiModal && activeOrder && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-[#121620] border border-border rounded-3xl p-6 max-w-sm w-full text-center relative overflow-hidden animate-fade-in space-y-5 shadow-2xl">
            
            <div>
              <h3 className="font-heading font-black text-lg text-white">Sandbox UPI Gateway</h3>
              <p className="text-[10px] text-gray-500 font-semibold mt-1">Cryptographic Webhook Loop Simulator</p>
            </div>

            {/* QR Mockup Canvas */}
            <div className="w-52 h-52 bg-white rounded-2xl mx-auto flex items-center justify-center p-3 relative shadow-inner">
              <div className="absolute inset-0 bg-[#000]/5 flex items-center justify-center rounded-2xl pointer-events-none"></div>
              <div className="text-center text-black">
                <QrCode className="w-36 h-36 mx-auto text-black" />
                <p className="text-[9px] font-black tracking-wide mt-2">BHARATPREDICT MOCK MERCHANT</p>
              </div>
            </div>

            {/* Price tag */}
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Deposit Capital</p>
              <h4 className="text-3xl font-black text-white font-heading mt-1">
                ₹{parseFloat(depositAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-[9px] font-mono text-gray-500 mt-1 truncate">ID: {activeOrder.orderId}</p>
            </div>

            {/* Control buttons */}
            <div className="space-y-2">
              {paymentSuccess ? (
                <div className="py-3 rounded-xl bg-brand-yesMuted border border-brand-yes/30 flex items-center justify-center gap-1.5 text-xs text-brand-yes font-bold">
                  <CheckCircle2 className="w-5 h-5 animate-bounce" /> WEBHOOK SECURED & SETTLED
                </div>
              ) : (
                <button
                  onClick={handleSimulatedPayment}
                  disabled={isProcessingPay}
                  className="w-full py-3.5 rounded-xl bg-brand-yes hover:bg-green-600 text-white font-extrabold uppercase tracking-wide text-xs shadow-glow transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  {isProcessingPay ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      SIGNING WEBHOOK SIGNATURE...
                    </>
                  ) : (
                    'SIMULATE SIGNED PAYMENT'
                  )}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setShowUpiModal(false);
                  setActiveOrder(null);
                }}
                disabled={isProcessingPay}
                className="w-full py-3.5 rounded-xl bg-[#0b0e14] hover:bg-[#181d2a] border border-border text-gray-400 hover:text-white font-bold text-xs transition-all duration-200"
              >
                CANCEL DEPOSIT
              </button>
            </div>

            <div className="text-[9px] text-gray-500 font-semibold pt-1 border-t border-border/40 text-left space-y-1">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-brand-yes" /> Verifies standard HMAC SHA256 signatures.</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-accent" /> Wallet balance updates via real-time WebSocket.</span>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
