import { Controller, Get, Post, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any) {
    const list = await this.notificationsService.getNotifications(req.user.id);
    return {
      success: true,
      data: list,
    };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const notification = await this.notificationsService.markAsRead(req.user.id, id);
    return {
      success: true,
      data: notification,
    };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return {
      success: true,
    };
  }
}
