import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createNotification(
    userId: string,
    type: 'TRADE' | 'SETTLEMENT' | 'MARKET_CLOSING' | 'COPY_TRADE',
    title: string,
    body: string,
    metadata?: any,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Broadcast in real-time via Socket.IO
    this.realtime.broadcastNotification(userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read: notification.read,
      metadata: metadata || null,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async getNotifications(userId: string) {
    const list = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return list.map((item) => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
    }));
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return {
      ...updated,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }
}
