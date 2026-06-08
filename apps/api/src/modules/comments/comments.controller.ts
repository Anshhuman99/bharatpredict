import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentRequestDto } from '@bharatpredict/types';

@Controller('markets')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return await this.commentsService.getComments(id);
  }

  @Post(':id/comments')
  async createComment(
    @Param('id') id: string,
    @Body() dto: Omit<CommentRequestDto, 'marketId'>,
  ) {
    return await this.commentsService.createComment({
      marketId: id,
      userId: dto.userId,
      text: dto.text,
    });
  }
}
