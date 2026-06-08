import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CommentRequestDto } from '@bharatpredict/types';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getComments(marketId: string) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });
    if (!market) {
      throw new NotFoundException('Market not found');
    }

    return await this.prisma.comment.findMany({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, avatar: true },
        },
      },
    });
  }

  async createComment(dto: CommentRequestDto) {
    const { marketId, userId, text } = dto;
    if (!text || text.trim() === '') {
      throw new BadRequestException('Comment text cannot be empty');
    }

    // Verify user and market exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    if (!market) {
      throw new NotFoundException('Market not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        marketId,
        userId,
        text,
      },
      include: {
        user: {
          select: { username: true, avatar: true },
        },
      },
    });

    // Broadcast the comment in real time
    this.realtime.broadcastNewComment(marketId, {
      id: comment.id,
      marketId: comment.marketId,
      userId: comment.userId,
      text: comment.text,
      createdAt: comment.createdAt,
      user: comment.user,
    });

    return comment;
  }
}
