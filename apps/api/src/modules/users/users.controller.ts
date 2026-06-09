import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId/profile')
  async getPublicProfile(@Param('userId') userId: string) {
    return await this.usersService.getPublicProfile(userId);
  }
}
