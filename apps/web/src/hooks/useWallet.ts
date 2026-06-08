import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Market, PortfolioSummary, Trade } from '@bharatpredict/types';

interface WalletState {
  token: string | null;
  userId: string | null;
  username: string | null;
  avatar: string | null;
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
  isAuthenticated: boolean;
  
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
  
  // Auth Actions
  signup: (username: string) => Promise<any>;
  login: (username: string, passphrase: string) => Promise<any>;
  logout: () => Promise<void>;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

export const useWallet = create<WalletState>((set, get) => ({
  token: null,
  userId: null,
  username: null,
  avatar: null,
  walletBalance: 0,
  portfolio: null,
  markets: [],
  globalTrades: [],
  activeCopyRelations: [],
  socket: null,
  socketConnected: false,
  isLoading: false,
  portfolioError: null,
  isInitialized: false,
  isAuthenticated: false,

  init: async () => {
    if (get().isInitialized) {
      return;
    }

    set({ isLoading: true });

    // 1. Load token from localStorage
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // Always fetch public markets
    await get().fetchMarkets();

    if (savedToken) {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` }
        });

        if (res.ok) {
          const payload = await res.json();
          if (payload.success) {
            const user = payload.data;
            set({
              token: savedToken,
              userId: user.id,
              username: user.username,
              avatar: user.avatar,
              walletBalance: user.walletBalance,
              isAuthenticated: true,
            });

            // Fetch user specific data
            await get().fetchPortfolio();
            await get().fetchCopyRelations();
          } else {
            // Token invalid or expired
            if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
          }
        } else {
          if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
        }
      } catch (e) {
        console.error('Failed to validate session during init:', e);
      }
    }

    set({ isInitialized: true, isLoading: false });

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

      // Listen for dynamic wallet updates if authenticated
      const currentUserId = get().userId;
      if (currentUserId) {
        socket.on(`wallet_${currentUserId}`, (data: { balance: number }) => {
          set({ walletBalance: data.balance });
          get().fetchPortfolio(); // Refresh portfolio
          get().fetchCopyRelations(); // Refresh copy relations
        });
      }

      set({ socket });
    }
  },

  signup: async (username: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Signup failed');
      }

      const { user, token, passphrase } = payload.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }

      set({
        token,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        isAuthenticated: true,
      });

      // Initialize Socket listeners for the new user ID
      const socket = get().socket;
      if (socket) {
        socket.off(`wallet_${user.id}`); // prevent duplicate
        socket.on(`wallet_${user.id}`, (data: { balance: number }) => {
          set({ walletBalance: data.balance });
          get().fetchPortfolio();
          get().fetchCopyRelations();
        });
      }

      await get().fetchPortfolio();
      await get().fetchCopyRelations();

      return { success: true, passphrase };
    } catch (e: any) {
      console.error('Signup failed:', e);
      return { success: false, message: e.message };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username: string, passphrase: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, passphrase }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.message || 'Login failed');
      }

      const { user, token } = payload.data;

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
      }

      set({
        token,
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        isAuthenticated: true,
      });

      // Bind Socket event for this user
      const socket = get().socket;
      if (socket) {
        socket.off(`wallet_${user.id}`);
        socket.on(`wallet_${user.id}`, (data: { balance: number }) => {
          set({ walletBalance: data.balance });
          get().fetchPortfolio();
          get().fetchCopyRelations();
        });
      }

      await get().fetchPortfolio();
      await get().fetchCopyRelations();

      return { success: true };
    } catch (e: any) {
      console.error('Login failed:', e);
      return { success: false, message: e.message };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const token = get().token;
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Failed to logout cleanly on backend:', e);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }

    // Clean up socket listener
    const socket = get().socket;
    const userId = get().userId;
    if (socket && userId) {
      socket.off(`wallet_${userId}`);
    }

    set({
      token: null,
      userId: null,
      username: null,
      avatar: null,
      walletBalance: 0,
      portfolio: null,
      activeCopyRelations: [],
      isAuthenticated: false,
    });
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
    const token = get().token;
    if (!token) return;

    try {
      set({ portfolioError: null });
      const res = await fetch(`${API_URL}/portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        set({ portfolioError: errPayload.message || 'Failed to fetch portfolio data.' });
      }
    } catch (e: any) {
      console.error('Error fetching portfolio:', e);
      set({ portfolioError: e.message || 'Failed to connect to the server.' });
    }
  },

  fetchCopyRelations: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/copytrading/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    const token = get().token;
    if (!token) {
      return { success: false, message: 'Please login to trade' };
    }

    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/trade`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
    const token = get().token;
    if (!token) {
      return { success: false, message: 'Please login to trade' };
    }

    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/trade/sell`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
    const token = get().token;
    if (!token) return { success: false, message: 'Please login' };

    try {
      const res = await fetch(`${API_URL}/wallet/deposit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount }),
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
    const token = get().token;
    if (!token) return { success: false, message: 'Please login' };

    try {
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount }),
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
    const token = get().token;
    if (!token) return { success: false, message: 'Please login' };

    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/copytrading/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
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
      const updated = [trade, ...state.globalTrades].slice(0, 30);
      
      const updatedMarkets = state.markets.map((m) => {
        if (m.id === trade.marketId) {
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
