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

  async getComments(marketId: string, currentUserId?: string) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId },
    });
    if (!market) {
      throw new NotFoundException('Market not found');
    }

    const comments = await this.prisma.comment.findMany({
      where: { marketId },
      include: {
        votes: true,
        user: {
          select: {
            username: true,
            avatar: true,
            stats: true,
            achievements: true,
          },
        },
      },
    });

    // Map database structures to types
    const formattedComments = comments.map(c => {
      const votes = c.votes || [];
      const upvotes = votes.filter(v => v.value === 1).length;
      const downvotes = votes.filter(v => v.value === -1).length;
      const myVote = currentUserId ? (votes.find(v => v.userId === currentUserId)?.value || null) : null;

      const userStats = c.user?.stats;
      const userAchievements = c.user?.achievements || [];
      const achievements = userAchievements.map(a => a.type);
      
      const totalPredictions = userStats?.totalPredictions || 0;
      const correctPredictions = userStats?.correctPredictions || 0;
      const winRate = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
      const level = userStats?.level || 1;
      const currentStreak = userStats?.currentStreak || 0;

      // Expert criteria: level >= 5 OR win rate >= 75% (min 5 predictions) OR has IPL_MASTER badge
      const isExpert = level >= 5 || 
                       (totalPredictions >= 5 && winRate >= 75) || 
                       achievements.includes('IPL_MASTER');

      return {
        id: c.id,
        marketId: c.marketId,
        userId: c.userId,
        text: c.text,
        parentId: c.parentId,
        createdAt: c.createdAt,
        upvotes,
        downvotes,
        myVote,
        user: {
          username: c.user?.username || 'Anonymous',
          avatar: c.user?.avatar || '',
          level,
          winRate,
          currentStreak,
          isExpert,
          achievements,
        },
        replies: [] as any[],
      };
    });

    // Build comment reply threads (hierarchy tree)
    const commentMap = new Map<string, any>();
    formattedComments.forEach(c => commentMap.set(c.id, c));

    const rootComments: any[] = [];
    formattedComments.forEach(c => {
      if (c.parentId) {
        const parent = commentMap.get(c.parentId);
        if (parent) {
          parent.replies.push(c);
        } else {
          rootComments.push(c);
        }
      } else {
        rootComments.push(c);
      }
    });

    // Sorting function: Expert Comments + High score (Upvotes - Downvotes) first
    const sortFn = (a: any, b: any) => {
      if (a.user.isExpert && !b.user.isExpert) return -1;
      if (!a.user.isExpert && b.user.isExpert) return 1;
      
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    rootComments.sort(sortFn);
    
    const sortReplies = (comment: any) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a: any, b: any) => {
          const scoreA = a.upvotes - a.downvotes;
          const scoreB = b.upvotes - b.downvotes;
          if (scoreA !== scoreB) return scoreB - scoreA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        comment.replies.forEach(sortReplies);
      }
    };
    rootComments.forEach(sortReplies);

    return rootComments;
  }

  async createComment(dto: CommentRequestDto) {
    const { marketId, userId, text, parentId } = dto;
    if (!text || text.trim() === '') {
      throw new BadRequestException('Comment text cannot be empty');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const market = await this.prisma.market.findUnique({ where: { id: marketId } });
    if (!market) {
      throw new NotFoundException('Market not found');
    }

    if (parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        marketId,
        userId,
        text,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
            stats: true,
            achievements: true,
          },
        },
      },
    });

    const userStats = comment.user?.stats;
    const achievements = (comment.user?.achievements || []).map(a => a.type);
    const totalPredictions = userStats?.totalPredictions || 0;
    const correctPredictions = userStats?.correctPredictions || 0;
    const winRate = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
    const level = userStats?.level || 1;
    const currentStreak = userStats?.currentStreak || 0;
    const isExpert = level >= 5 || (totalPredictions >= 5 && winRate >= 75) || achievements.includes('IPL_MASTER');

    const broadcastPayload = {
      id: comment.id,
      marketId: comment.marketId,
      userId: comment.userId,
      text: comment.text,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      upvotes: 0,
      downvotes: 0,
      myVote: null,
      user: {
        username: comment.user?.username || 'Anonymous',
        avatar: comment.user?.avatar || '',
        level,
        winRate,
        currentStreak,
        isExpert,
        achievements,
      },
      replies: [] as any[],
    };

    // Broadcast the comment in real time
    this.realtime.broadcastNewComment(marketId, broadcastPayload);

    return broadcastPayload;
  }

  async voteComment(commentId: string, userId: string, value: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (value === 0) {
      try {
        await this.prisma.commentVote.delete({
          where: {
            commentId_userId: { commentId, userId },
          },
        });
      } catch {}
    } else {
      await this.prisma.commentVote.upsert({
        where: {
          commentId_userId: { commentId, userId },
        },
        create: {
          commentId,
          userId,
          value,
        },
        update: {
          value,
        },
      });
    }

    const votes = await this.prisma.commentVote.findMany({
      where: { commentId },
    });

    const upvotes = votes.filter(v => v.value === 1).length;
    const downvotes = votes.filter(v => v.value === -1).length;

    return {
      commentId,
      upvotes,
      downvotes,
      myVote: value !== 0 ? value : null,
    };
  }
}
