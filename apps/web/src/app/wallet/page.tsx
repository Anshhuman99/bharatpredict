'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import Sidebar from '../../components/Sidebar';
import MobileHeader from '../../components/MobileHeader';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gift,
  Award,
  ArrowDownLeft
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

export default function Wallet() {
  const { init, walletBalance, reputationPoints, depositCash, redeemVoucher, isAuthenticated, isInitialized, token } = useWallet();
  const router = useRouter();
  
  const [walletDetails, setWalletDetails] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<any>(null);

  const fetchLedger = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletDetails(data);
        if (data.redemptions) {
          setRedemptions(data.redemptions);
        }
      }

      const rewardsRes = await fetch(`${API_URL}/payments/rewards`);
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
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

  const handleClaimAllowance = async (amount: number) => {
    setLedgerError(null);
    setRedeemedCode(null);
    setIsProcessingPay(true);
    try {
      const res = await depositCash(amount);
      if (res.success) {
        fetchLedger();
      } else {
        setLedgerError(res.message || 'Allowance claim failed');
      }
    } catch (err: any) {
      setLedgerError(err.message || 'Server connection failed');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    setLedgerError(null);
    setRedeemedCode(null);
    try {
      const res = await redeemVoucher(rewardId);
      if (res.success) {
        setRedeemedCode(res.redemption);
        fetchLedger();
      } else {
        setLedgerError(res.message || 'Redemption failed');
      }
    } catch (e: any) {
      setLedgerError(e.message || 'Server error');
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
              BP Coins & Rewards Shop
            </h2>
            <p className="text-xs text-muted font-medium mt-1">
              Earn social prediction coins and redeem them for shopping vouchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {/* BP Coins Card */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-accent/5 rounded-full blur-2xl"></div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Available BP Coins</span>
              <h3 className="text-3xl font-black text-white font-heading mt-2">
                {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })} BP
              </h3>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-semibold bg-[#0b0e14] border border-border/60 rounded-xl p-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-yes" />
                Virtual tokens only. No real money or fees applied.
              </div>
            </div>

            {/* Reputation Points Card */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-brand-yes/5 rounded-full blur-2xl"></div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">User Reputation Score</span>
              <h3 className="text-3xl font-black text-brand-yes font-heading mt-2">
                {reputationPoints.toFixed(0)} RP
              </h3>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-semibold bg-[#0b0e14] border border-border/60 rounded-xl p-2.5">
                <Award className="w-4 h-4 text-brand-accent" />
                Staking power for resolving prediction outcomes.
              </div>
            </div>
          </div>

          {ledgerError && (
            <div className="p-3 bg-brand-noMuted border border-brand-no/20 rounded-xl max-w-lg flex items-start gap-2.5 text-xs text-brand-no font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{ledgerError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Faucet & Ads Desk */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2.5">
                <ArrowDownLeft className="w-5 h-5 text-brand-yes" /> Coin Claim Center
              </h4>

              <div className="space-y-4">
                <div className="bg-[#0b0e14] border border-border/60 rounded-xl p-4 space-y-1">
                  <h5 className="text-xs font-extrabold text-white">Daily Coin Allowance</h5>
                  <p className="text-[10px] text-gray-400">Claim 500 BP Coins for free. Available once every 24 hours.</p>
                  <button
                    onClick={() => handleClaimAllowance(500)}
                    disabled={isProcessingPay}
                    className="w-full mt-3 py-2.5 rounded-lg bg-brand-yes hover:bg-green-600 shadow-glow text-white text-xs font-extrabold uppercase tracking-widest transition-all duration-200"
                  >
                    CLAIM +500 COINS
                  </button>
                </div>

                <div className="bg-[#0b0e14] border border-border/60 rounded-xl p-4 space-y-1">
                  <h5 className="text-xs font-extrabold text-white">Watch Rewarded Video Ad</h5>
                  <p className="text-[10px] text-gray-400">Watch a 15-second sponsor video to earn 200 BP Coins instantly.</p>
                  <button
                    onClick={() => handleClaimAllowance(200)}
                    disabled={isProcessingPay}
                    className="w-full mt-3 py-2.5 rounded-lg bg-brand-accent hover:bg-yellow-600 text-black text-xs font-extrabold uppercase tracking-widest transition-all duration-200"
                  >
                    WATCH AD (+200 COINS)
                  </button>
                </div>
              </div>
            </div>

            {/* Rewards Shop Grid */}
            <div className="bg-[#121620] border border-border/80 rounded-2xl p-6 space-y-4 col-span-1 lg:col-span-2">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-2.5">
                <Gift className="w-5 h-5 text-brand-accent" /> Redeem Coins for Rewards
              </h4>

              {redeemedCode && (
                <div className="p-4 bg-brand-yesMuted border border-brand-yes/30 rounded-xl flex flex-col gap-1.5 text-xs text-brand-yes font-medium animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-yes" />
                    Voucher Redeemed Successfully!
                  </div>
                  <div>Brand Voucher: <span className="font-bold text-white">{redeemedCode.rewardCode}</span></div>
                  <div>Voucher Code/PIN: <span className="font-mono bg-[#0b0e14] border border-border text-white px-2.5 py-1 rounded text-sm select-all font-bold">{redeemedCode.voucherPin}</span></div>
                  <div className="text-[10px] text-gray-400 mt-1">Copy this code to redeem on the official partner app/website.</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-[#0b0e14] border border-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-accent/50 transition-all duration-200">
                    <div className="space-y-2.5">
                      <img src={reward.image} alt={reward.name} className="w-full h-24 object-cover rounded-lg border border-border/60" />
                      <div>
                        <span className="text-[9px] bg-brand-accent/15 text-brand-accent px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{reward.category}</span>
                        <h5 className="text-xs font-bold text-white mt-1">{reward.name}</h5>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                      <span className="text-xs font-black text-brand-accent">{reward.cost} BP Coins</span>
                      <button
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={walletBalance < reward.cost}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
                          walletBalance >= reward.cost
                            ? 'bg-brand-accent text-black hover:bg-brand-accent/80'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        REDEEM
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Redeemed Vouchers list */}
          {redemptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-border/40 pb-2">
                My Redeemed Vouchers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {redemptions.map((red) => (
                  <div key={red.id} className="bg-[#121620] border border-border/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs font-bold text-white">{red.rewardCode}</span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {new Date(red.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-semibold">VOUCHER PIN</span>
                      <span className="text-xs font-mono font-bold text-white bg-[#0b0e14] px-2 py-1 rounded border border-border select-all w-fit">
                        {red.voucherPin}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-border/40 pb-2">
              Transaction History
            </h3>

            {!walletDetails || !walletDetails.transactions || walletDetails.transactions.length === 0 ? (
              <div className="bg-[#121620]/60 border border-border/60 rounded-3xl p-12 text-center">
                <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-base font-bold text-white">No Transactions Recorded</h4>
                <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto">
                  Your transaction history is completely clean. Claim free allowances or redeem coupon vouchers to see active records.
                </p>
              </div>
            ) : (
              <div className="bg-[#121620] border border-border rounded-2xl overflow-hidden shadow-lg text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-[#181d2a] text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Ledger Type</th>
                      <th className="px-6 py-4 text-right">BP Coins</th>
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
                          {tx.type === 'DEPOSIT' || tx.type === 'SETTLEMENT' ? '+' : '-'}{tx.amount} BP
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
