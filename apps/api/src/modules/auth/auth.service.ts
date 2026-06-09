import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

const VOCABULARY = [
  'dhoni', 'samosa', 'rupee', 'predict', 'chai', 'bazaar', 'metro', 'taj', 
  'dunes', 'kabaddi', 'cinema', 'monsoon', 'curry', 'biryani', 'cricket', 
  'market', 'trade', 'wealth', 'bull', 'bear', 'stocks', 'profit', 'delhi',
  'mumbai', 'bengaluru', 'ganges', 'himalaya', 'peacock', 'tiger', 'lotus',
  'mango', 'masala', 'kulfi', 'naan', 'diwali', 'holi', 'tandoor', 'rickshaw',
  'jungle', 'bollywood', 'yoga', 'guru', 'curd', 'saffron', 'rupee', 'nifty',
  'sensex', 'option', 'future', 'leverage', 'margin', 'delta', 'hedging',
  'payout', 'winning', 'streak', 'wallet', 'token', 'ledger', 'smart',
  'contract', 'yield', 'liquidity', 'arbitrage', 'trend', 'volume', 'asset'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200'
];

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  generatePassphrase(): string {
    const chosenWords: string[] = [];
    const tempVocabulary = [...VOCABULARY];
    
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * tempVocabulary.length);
      chosenWords.push(tempVocabulary[randomIndex]);
      tempVocabulary.splice(randomIndex, 1);
    }
    
    return chosenWords.join('-');
  }

  hashPassphrase(passphrase: string): string {
    return crypto.createHash('sha256').update(passphrase).digest('hex');
  }

  async signup(username: string) {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      throw new ConflictException('Username cannot be empty');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: trimmedUsername }
    });

    if (existingUser) {
      throw new ConflictException('Username is already taken');
    }

    // Generate unique passphrase
    const passphrase = this.generatePassphrase();
    const hash = this.hashPassphrase(passphrase);

    // Pick a random avatar
    const avatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];

    // Create user with starting balance of ₹1000.00
    const user = await this.prisma.user.create({
      data: {
        username: trimmedUsername,
        passphraseHash: hash,
        avatar,
        walletBalance: 1000.00,
      }
    });

    // Create active session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await this.prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      }
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        reputationPoints: user.reputationPoints,
        role: user.role
      },
      passphrase,
      token,
    };
  }

  async login(username: string, passphrase: string) {
    const trimmedUsername = username.trim();
    const normalizedPassphrase = passphrase.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { username: trimmedUsername }
    });

    if (!user || !user.passphraseHash) {
      throw new UnauthorizedException('Invalid username or passphrase');
    }

    const inputHash = this.hashPassphrase(normalizedPassphrase);
    if (user.passphraseHash !== inputHash) {
      throw new UnauthorizedException('Invalid username or passphrase');
    }

    // Create active session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await this.prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      }
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        reputationPoints: user.reputationPoints,
        role: user.role
      },
      token,
    };
  }

  async validateSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await this.prisma.session.delete({ where: { token } });
      return null;
    }

    return {
      id: session.user.id,
      username: session.user.username,
      avatar: session.user.avatar,
      walletBalance: session.user.walletBalance,
      reputationPoints: session.user.reputationPoints,
      role: session.user.role
    };
  }

  async revokeSession(token: string) {
    try {
      await this.prisma.session.delete({
        where: { token }
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}
