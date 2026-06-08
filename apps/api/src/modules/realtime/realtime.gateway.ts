import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private logger: Logger = new Logger('RealtimeGateway');

  afterInit(server: Server) {
    this.logger.log('Socket.IO Gateway initialized with namespace support');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection_success', { status: 'connected' });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Room subscription handler for Markets
   */
  @SubscribeMessage('subscribe_market')
  handleSubscribeMarket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { marketId: string },
  ) {
    const room = `market:${data.marketId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to room: ${room}`);
    return { event: 'subscribe_market', status: 'SUCCESS', room };
  }

  @SubscribeMessage('unsubscribe_market')
  handleUnsubscribeMarket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { marketId: string },
  ) {
    const room = `market:${data.marketId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from room: ${room}`);
    return { event: 'unsubscribe_market', status: 'SUCCESS', room };
  }

  /**
   * Room subscription handler for Users
   */
  @SubscribeMessage('subscribe_user')
  handleSubscribeUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const room = `user:${data.userId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to room: ${room}`);
    return { event: 'subscribe_user', status: 'SUCCESS', room };
  }

  broadcastMarketPrice(marketId: string, yesPrice: number, noPrice: number, volume: number) {
    if (this.server) {
      const payload = {
        marketId,
        yesPrice,
        noPrice,
        volume,
        timestamp: new Date(),
      };

      // 1. Room-based targeted emit (highly scalable!)
      this.server.to(`market:${marketId}`).emit('market:update', payload);

      // 2. Backward-compatible global broadcast
      this.server.emit(`market_price_${marketId}`, payload);
    }
  }

  broadcastNewTrade(trade: any) {
    if (this.server) {
      const payload = {
        ...trade,
        timestamp: new Date(),
      };

      // 1. Room-based targeted emit to active market subscribers
      this.server.to(`market:${trade.marketId}`).emit('trade:new', payload);

      // 2. Global broadcast for scrolling ticker feed
      this.server.emit('new_trade', payload);
    }
  }

  broadcastWalletUpdate(userId: string, balance: number) {
    if (this.server) {
      const payload = {
        userId,
        balance,
        timestamp: new Date(),
      };

      // 1. Room-based private emit to user room
      this.server.to(`user:${userId}`).emit('wallet:update', payload);

      // 2. Backward-compatible target emit
      this.server.emit(`wallet_${userId}`, { balance });
    }
  }

  broadcastNewComment(marketId: string, comment: any) {
    if (this.server) {
      const payload = {
        ...comment,
        timestamp: new Date(),
      };

      // 1. Room-based emit
      this.server.to(`market:${marketId}`).emit('comment:new', payload);

      // 2. Backward-compatible targeted broadcast
      this.server.emit(`new_comment_${marketId}`, payload);
    }
  }
}
