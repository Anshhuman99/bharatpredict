import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CopyTradingRequestDto } from '@bharatpredict/types';

@Injectable()
export class CopyTradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async startCopyTrading(dto: CopyTradingRequestDto) {
    const { copierId, leaderId, allocated } = dto;

    if (allocated <= 0) {
      throw new BadRequestException('Allocation capital must be greater than zero');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Verify copier user exists and has enough capital
      const copier = await tx.user.findUnique({
        where: { id: copierId },
      });

      if (!copier) {
        throw new NotFoundException('Copier user not found');
      }

      // Verify leader user exists
      const leader = await tx.user.findUnique({
        where: { id: leaderId },
      });

      if (!leader) {
        throw new NotFoundException('Leader user not found');
      }

      if (copier.walletBalance < allocated) {
        throw new BadRequestException(`Insufficient balance to allocate. Available: ₹${copier.walletBalance.toFixed(2)}, Required: ₹${allocated.toFixed(2)}`);
      }

      // 2. Check if already copying this leader actively
      const existing = await tx.copyTradingRelation.findFirst({
        where: { copierId, leaderId, active: true },
      });

      if (existing) {
        throw new BadRequestException(`You are already actively copying trades from ${leaderId}`);
      }

      // 3. Deduct allocated balance from copier wallet
      const updatedCopier = await tx.user.update({
        where: { id: copierId },
        data: {
          walletBalance: {
            decrement: allocated,
          },
        },
      });

      // 4. Record transaction ledger
      await tx.transaction.create({
        data: {
          userId: copierId,
          type: 'WITHDRAW',
          amount: allocated,
          status: 'SUCCESS',
        },
      });

      // 5. Create Copy Relation
      const relation = await tx.copyTradingRelation.create({
        data: {
          copierId,
          leaderId,
          allocated,
          profits: 0.0,
          active: true,
        },
      });

      // 6. Broadcast real-time balance update
      this.realtime.broadcastWalletUpdate(copierId, updatedCopier.walletBalance);

      return {
        success: true,
        relationId: relation.id,
        newBalance: updatedCopier.walletBalance,
      };
    });
  }

  async getActiveRelations(userId: string) {
    return await this.prisma.copyTradingRelation.findMany({
      where: { copierId: userId, active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async simulateLeaderTrades(userId: string) {
    const activeRelations = await this.prisma.copyTradingRelation.findMany({
      where: { copierId: userId, active: true },
    });

    for (const rel of activeRelations) {
      // 10% chance per query of a new copied trade payout to keep the screen reactive
      if (Math.random() > 0.4) {
        const profitGain = parseFloat((Math.random() * 85 + 15).toFixed(2)); // mock ₹15 - ₹100 passive profit!
        
        const updatedBalance = await this.prisma.$transaction(async (tx) => {
          // Increment copy profits
          await tx.copyTradingRelation.update({
            where: { id: rel.id },
            data: {
              profits: { increment: profitGain },
            },
          });

          // Proportional ledger transaction entry
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              walletBalance: { increment: profitGain },
            },
          });

          await tx.transaction.create({
            data: {
              userId,
              type: 'SETTLEMENT',
              amount: profitGain,
              status: 'SUCCESS',
            },
          });

          return updatedUser.walletBalance;
        });

        // Broadcast the real-time balance update to the user
        this.realtime.broadcastWalletUpdate(userId, updatedBalance);
      }
    }
  }
}
