import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() body: { username: string }) {
    return {
      success: true,
      data: await this.authService.signup(body.username),
      error: null
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; passphrase: string }) {
    return {
      success: true,
      data: await this.authService.login(body.username, body.passphrase),
      error: null
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    await this.authService.revokeSession(token);
    return {
      success: true,
      data: { message: 'Logged out successfully' },
      error: null
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: any) {
    return {
      success: true,
      data: req.user,
      error: null
    };
  }
}
