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
}
