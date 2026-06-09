import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WalletTransactionRequestDto } from '@bharatpredict/types';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        walletBalance: true,
        reputationPoints: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        redemptions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deposit(dto: WalletTransactionRequestDto) {
    const { userId, amount } = dto;
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be positive');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            increment: amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount,
          status: 'SUCCESS',
        },
      });

      return updated;
    });

    this.realtime.broadcastWalletUpdate(userId, updatedUser.walletBalance);

    return {
      success: true,
      balance: updatedUser.walletBalance,
    };
  }

  async withdraw(dto: WalletTransactionRequestDto) {
    const { userId, amount } = dto;
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be positive');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.walletBalance < amount) {
        throw new BadRequestException('Insufficient wallet balance to withdraw');
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAW',
          amount,
          status: 'SUCCESS',
        },
      });

      return updated;
    });

    this.realtime.broadcastWalletUpdate(userId, updatedUser.walletBalance);

    return {
      success: true,
      balance: updatedUser.walletBalance,
    };
  }
}
