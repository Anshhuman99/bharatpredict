import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentRequestDto } from '@bharatpredict/types';
import { AuthGuard } from '../auth/auth.guard';

@Controller('markets')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return await this.commentsService.getComments(id);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  async createComment(
    @Param('id') id: string,
    @Body() dto: Omit<CommentRequestDto, 'marketId'>,
    @Req() req: any
  ) {
    return await this.commentsService.createComment({
      marketId: id,
      userId: req.user.id,
      text: dto.text,
    });
  }
}

