import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AuthGuard } from '../auth/auth.guard';
import * as crypto from 'crypto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private readonly WEBHOOK_SECRET = 'sandbox_webhook_secret_key_123';

  @Post('create-order')
  async createOrder(@Body() dto: { userId: string; amount: number }) {
    return await this.paymentsService.createOrder(dto.userId, dto.amount);
  }

  @Post('simulate-webhook')
  async simulateWebhook(@Body() dto: { orderId: string; amount: number; userId: string }) {
    const { payload, signature } = await this.paymentsService.simulateWebhook(dto.orderId, dto.amount, dto.userId);
    await this.handleWebhook(signature, payload);
    return { payload, signature };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature header');
    }

    const bodyString = JSON.stringify(body);

    // Cryptographic signature check
    const expectedSignature = crypto
      .createHmac('sha256', this.WEBHOOK_SECRET)
      .update(bodyString)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Cryptographic verification failed: invalid webhook signature');
    }

    const event = body.event;
    if (event === 'payment.captured') {
      const paymentEntity = body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const userId = paymentEntity.notes.userId;
      const inrAmount = paymentEntity.amount / 100; // paisa to INR

      // Transactional credit ledger execution
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Find the pending transaction recorded during create-order
        const transaction = await tx.transaction.findUnique({
          where: { id: orderId },
        });

        if (!transaction) {
          throw new BadRequestException('Corresponding transaction not found');
        }

        if (transaction.status === 'SUCCESS') {
          return null; // Already processed, guarantee idempotency
        }

        // Update transaction status
        await tx.transaction.update({
          where: { id: orderId },
          data: {
            status: 'SUCCESS',
          },
        });

        // Credit copier balance
        return await tx.user.update({
          where: { id: userId },
          data: {
            walletBalance: {
              increment: inrAmount,
            },
          },
        });
      });

      if (updatedUser) {
        // Broadcast updates over Socket.IO
        this.realtime.broadcastWalletUpdate(userId, updatedUser.walletBalance);
      }
    }

    return { status: 'SUCCESS' };
  }

  @Get('rewards')
  getRewardsCatalog() {
    return this.paymentsService.getRewardsCatalog();
  }

  @Post('redeem-voucher')
  @UseGuards(AuthGuard)
  async redeemVoucher(@Body() dto: { rewardId: string }, @Req() req: any) {
    const result = await this.paymentsService.redeemVoucher(req.user.id, dto.rewardId);
    if (result.success) {
      // Broadcast wallet balance update
      this.realtime.broadcastWalletUpdate(req.user.id, result.newBalance);
    }
    return result;
  }
}
