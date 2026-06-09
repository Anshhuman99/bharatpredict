import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentRequestDto } from '@bharatpredict/types';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('markets')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly authService: AuthService,
  ) {}

  @Get(':id/comments')
  async getComments(@Param('id') id: string, @Req() req: any) {
    let currentUserId: string | undefined = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const user = await this.authService.validateSession(token);
        if (user) {
          currentUserId = user.id;
        }
      }
    }
    return await this.commentsService.getComments(id, currentUserId);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  async createComment(
    @Param('id') id: string,
    @Body() dto: { text: string; parentId?: string },
    @Req() req: any
  ) {
    return await this.commentsService.createComment({
      marketId: id,
      userId: req.user.id,
      text: dto.text,
      parentId: dto.parentId,
    });
  }

  @Post('comments/:commentId/vote')
  @UseGuards(AuthGuard)
  async voteComment(
    @Param('commentId') commentId: string,
    @Body() dto: { value: number },
    @Req() req: any
  ) {
    return await this.commentsService.voteComment(
      commentId,
      req.user.id,
      dto.value,
    );
  }
}
