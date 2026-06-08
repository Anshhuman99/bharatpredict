import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Market, PortfolioSummary, Trade, SYSTEM_USER_ID } from '@bharatpredict/types';

interface WalletState {
  userId: string;
  username: string;
  avatar: string;
  walletBalance: number;
  portfolio: PortfolioSummary | null;
  markets: Market[];
  globalTrades: any[];
  activeCopyRelations: any[];
  socket: Socket | null;
  socketConnected: boolean;
  isLoading: boolean;
  portfolioError: string | null;
  isInitialized: boolean;
  
  // Actions
  init: () => Promise<void>;
  fetchMarkets: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  fetchCopyRelations: () => Promise<void>;
  executeTrade: (marketId: string, side: 'YES' | 'NO', amount: number) => Promise<any>;
  executeSell: (marketId: string, side: 'YES' | 'NO', shares: number) => Promise<any>;
  depositCash: (amount: number) => Promise<any>;
  withdrawCash: (amount: number) => Promise<any>;
  startCopyTrading: (leaderId: string, allocated: number) => Promise<any>;
  addGlobalTrade: (trade: any) => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;
const USER_ID = SYSTEM_USER_ID; // Match UUID seeded in backend database

export const useWallet = create<WalletState>((set, get) => ({
  userId: USER_ID,
  username: 'Anshuman',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  walletBalance: 25000.00,
  portfolio: null,
  markets: [],
  globalTrades: [],
  activeCopyRelations: [],
  socket: null,
  socketConnected: false,
  isLoading: false,
  portfolioError: null,
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) {
      return;
    }

    set({ isLoading: true });

    // 1. Initial REST loads
    await get().fetchMarkets();
    await get().fetchPortfolio();
    await get().fetchCopyRelations();

    if (!get().portfolioError) {
      set({ isInitialized: true });
    }

    set({ isLoading: false });

    // 2. Connect WebSocket for real-time tickers
    if (!get().socket) {
      const socket = io(BASE_URL);

      socket.on('connect', () => {
        set({ socketConnected: true });
        console.log('🔌 Connected to BharatPredict Socket.IO Server');
      });

      socket.on('disconnect', () => {
        set({ socketConnected: false });
        console.log('🔌 Disconnected from Socket.IO Server');
      });

      // Handle real-time price updates for active markets
      socket.on('new_trade', (trade: any) => {
        get().addGlobalTrade(trade);
      });

      // Handle direct real-time wallet update broadcasts
      socket.on(`wallet_${USER_ID}`, (data: { balance: number }) => {
        set({ walletBalance: data.balance });
        get().fetchPortfolio(); // Refresh portfolio summary on wallet credit/debit
        get().fetchCopyRelations(); // Refresh copy relations on passive gains
      });

      set({ socket });
    }
  },

  fetchMarkets: async () => {
    try {
      const res = await fetch(`${API_URL}/markets`);
      if (res.ok) {
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        set({ markets: data });
      }
    } catch (e) {
      console.error('Error fetching markets:', e);
    }
  },

  fetchPortfolio: async () => {
    try {
      set({ portfolioError: null });
      const res = await fetch(`${API_URL}/portfolio?userId=${USER_ID}`);
      if (res.ok) {
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        set({
          portfolio: data,
          walletBalance: data.walletBalance,
          portfolioError: null,
        });
      } else {
        const errPayload = await res.json().catch(() => ({}));
        set({ portfolioError: errPayload.message || 'Failed to fetch portfolio data. Please make sure database is seeded.' });
      }
    } catch (e: any) {
      console.error('Error fetching portfolio:', e);
      set({ portfolioError: e.message || 'Failed to connect to the server.' });
    }
  },

  fetchCopyRelations: async () => {
    try {
      const res = await fetch(`${API_URL}/copytrading/active?userId=${USER_ID}`);
      if (res.ok) {
        const payload = await res.json();
        const data = payload.success ? payload.data : payload;
        set({ activeCopyRelations: data });
      }
    } catch (e) {
      console.error('Error fetching active copy trading relations:', e);
    }
  },

  executeTrade: async (marketId: string, side: 'YES' | 'NO', amount: number) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          marketId,
          side,
          amount,
        }),
      });

      const payload = await res.json();
      const data = payload.success ? payload.data : payload;
      if (!res.ok) {
        throw new Error(payload.error?.message || payload.message || 'Trade execution failed');
      }

      // Refresh state locally
      await get().fetchPortfolio();
      await get().fetchMarkets();

      return { success: true, ...data };
    } catch (e: any) {
      console.error('Trade execution failed:', e);
      return { success: false, message: e.message };
    } finally {
      set({ isLoading: false });
    }
  },

  executeSell: async (marketId: string, side: 'YES' | 'NO', shares: number) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/trade/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          marketId,
          side,
          shares,
        }),
      });

      const payload = await res.json();
      const data = payload.success ? payload.data : payload;
      if (!res.ok) {
        throw new Error(payload.error?.message || payload.message || 'Sell failed');
      }

      await get().fetchPortfolio();
      await get().fetchMarkets();

      return { success: true, ...data };
    } catch (e: any) {
      console.error('Sell execution failed:', e);
      return { success: false, message: e.message };
    } finally {
      set({ isLoading: false });
    }
  },

  depositCash: async (amount: number) => {
    try {
      const res = await fetch(`${API_URL}/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          amount,
        }),
      });
      const payload = await res.json();
      if (res.ok) {
        await get().fetchPortfolio();
        return { success: true };
      }
      return { success: false, message: payload.error?.message || payload.message };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  withdrawCash: async (amount: number) => {
    try {
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          amount,
        }),
      });
      const payload = await res.json();
      if (res.ok) {
        await get().fetchPortfolio();
        return { success: true };
      }
      return { success: false, message: payload.error?.message || payload.message };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  startCopyTrading: async (leaderId: string, allocated: number) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/copytrading/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copierId: USER_ID,
          leaderId,
          allocated,
        }),
      });
      const payload = await res.json();
      const data = payload.success ? payload.data : payload;
      if (!res.ok) {
        throw new Error(payload.error?.message || payload.message || 'Copy trading allocation failed');
      }

      await get().fetchPortfolio();
      await get().fetchCopyRelations();
      return { success: true, ...data };
    } catch (e: any) {
      return { success: false, message: e.message };
    } finally {
      set({ isLoading: false });
    }
  },

  addGlobalTrade: (trade: any) => {
    set((state) => {
      // Keep only last 30 trades in local tickers memory
      const updated = [trade, ...state.globalTrades].slice(0, 30);
      
      // Also update matching market's current prices in the local state array for instantaneous UI updates
      const updatedMarkets = state.markets.map((m) => {
        if (m.id === trade.marketId) {
          // Approximate the new price based on trading updates if not fully re-fetched
          return {
            ...m,
            volume: m.volume + trade.amount,
          };
        }
        return m;
      });

      return {
        globalTrades: updated,
        markets: updatedMarkets,
      };
    });
  },
}));
