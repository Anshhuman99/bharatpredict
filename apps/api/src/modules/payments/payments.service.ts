import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';


@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly WEBHOOK_SECRET = 'sandbox_webhook_secret_key_123';

  async createOrder(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    
    // Create a pending ledger transaction entry
    await this.prisma.transaction.create({
      data: {
        id: orderId,
        userId,
        type: 'DEPOSIT',
        amount,
        status: 'PENDING',
      },
    });

    // Generate real standard UPI Intent URL
    // Format: upi://pay?pa=merchant_upi_id&pn=Merchant_Name&am=Amount&cu=Currency&tr=Txn_Ref_Id
    const upiIntentUrl = `upi://pay?pa=bharatpredict@okaxis&pn=BharatPredict&am=${amount.toFixed(2)}&cu=INR&tr=${orderId}`;

    return {
      success: true,
      orderId,
      amount: amount * 100, // standard gateway payload in paisa
      currency: 'INR',
      upiIntentUrl,
      userId,
    };
  }

  async simulateWebhook(orderId: string, amount: number, userId: string) {
    // 1. Build standard Razorpay captures payload
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_${crypto.randomBytes(8).toString('hex')}`,
            order_id: orderId,
            amount: amount * 100, // paise
            notes: {
              userId,
            },
          },
        },
      },
    };

    const payloadString = JSON.stringify(payload);

    // 2. Generate real cryptographically secure SHA256 HMAC signature
    const signature = crypto
      .createHmac('sha256', this.WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    // 3. Local loops: instead of external redirects, we directly invoke our Webhook receiver
    // to process the transaction locally, verifying signatures and updating balances!
    return {
      payload,
      signature,
    };
  }

  getRewardsCatalog() {
    return [
      { id: 'amzn-250', name: 'Amazon Pay Gift Card ₹250', cost: 250, image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=200', category: 'Shopping' },
      { id: 'fk-500', name: 'Flipkart Gift Card ₹500', cost: 500, image: 'https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&q=80&w=200', category: 'Shopping' },
      { id: 'swg-100', name: 'Swiggy Food Voucher ₹100', cost: 100, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=200', category: 'Food' },
      { id: 'bms-150', name: 'BookMyShow Movie Voucher ₹150', cost: 150, image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=200', category: 'Entertainment' },
    ];
  }

  async redeemVoucher(userId: string, rewardId: string) {
    const catalog = this.getRewardsCatalog();
    const item = catalog.find((x) => x.id === rewardId);
    if (!item) {
      throw new BadRequestException('Reward item not found in catalog');
    }

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.walletBalance < item.cost) {
        throw new BadRequestException(`Insufficient BP Coins. Required: ${item.cost}, Available: ${user.walletBalance}`);
      }

      // Deduct coins
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: item.cost,
          },
        },
      });

      // Generate voucher pin
      const voucherPin = `${item.id.toUpperCase().split('-')[0]}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Create redemption record
      const redemption = await tx.couponRedemption.create({
        data: {
          userId,
          rewardCode: item.name,
          voucherPin,
          tokenCost: item.cost,
        },
      });

      // Log a transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'WITHDRAW',
          amount: item.cost,
          status: 'SUCCESS',
        },
      });

      return {
        success: true,
        redemption,
        newBalance: updatedUser.walletBalance,
      };
    });
  }
}

