export interface User {
  id: string;
  username: string;
  avatar: string;
  walletBalance: number;
  createdAt: Date | string;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string; // 'IPL' | 'Finance' | 'Politics' | 'Bollywood'
  image: string;
  endDate: Date | string;
  resolved: boolean;
  outcome: 'YES' | 'NO' | null;
  liquidity: number; // b parameter
  yesShares: number; // q1
  noShares: number;  // q2
  volume: number;    // total INR volume
  aiConfidence: number;
  marketSentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  trendingNarrative: string;
  yesPrice?: number;
  noPrice?: number;
  createdAt: Date | string;
}

export interface Trade {
  id: string;
  userId: string;
  marketId: string;
  side: 'YES' | 'NO';
  amount: number; // INR invested
  shares: number; // Shares bought
  price: number;  // average share price (INR)
  createdAt: Date | string;
}

export interface Holding {
  id: string;
  userId: string;
  marketId: string;
  yesShares: number;
  noShares: number;
  market?: Market;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'BUY_YES' | 'BUY_NO' | 'SELL_YES' | 'SELL_NO' | 'SETTLEMENT';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: Date | string;
}

export interface TradeRequestDto {
  userId: string;
  marketId: string;
  side: 'YES' | 'NO';
  amount: number; // INR cash amount
}

export interface SellRequestDto {
  userId: string;
  marketId: string;
  side: 'YES' | 'NO'; // which shares to sell
  shares: number;     // exact number of shares to sell back to AMM
}

export interface WalletTransactionRequestDto {
  userId: string;
  amount: number;
}

export interface PortfolioHolding extends Holding {
  market: Market & { yesPrice: number; noPrice: number };
  currentValue: number;
  costBasis: number;      // total INR spent buying these shares
  unrealizedPnL: number; // currentValue - costBasis
}

export interface PortfolioSummary {
  walletBalance: number;
  totalHoldingsValue: number;
  netWorth: number;
  totalPnL: number;
  winRate: number;
  holdings: PortfolioHolding[];
  recentTrades: Trade[];
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatar: string;
  totalEarnings: number;
  accuracy: number;
  volumeTraded: number;
}

export interface Comment {
  id: string;
  marketId: string;
  userId: string;
  text: string;
  createdAt: Date | string;
  user?: {
    username: string;
    avatar: string;
  };
}

export interface Candlestick {
  time: string;
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
}

export interface CopyTradingRelation {
  id: string;
  copierId: string;
  leaderId: string;
  allocated: number;
  profits: number;
  active: boolean;
  createdAt: Date | string;
}

export interface CommentRequestDto {
  marketId: string;
  userId: string;
  text: string;
}

export interface CopyTradingRequestDto {
  copierId: string;
  leaderId: string;
  allocated: number;
}

export const SYSTEM_USER_ID = 'anshuman-user-uuid';


