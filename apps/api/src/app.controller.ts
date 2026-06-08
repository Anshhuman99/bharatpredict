import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: '🚀 Welcome to the BharatPredict Backend API!',
      status: 'healthy',
      apiDocs: 'Use standard REST endpoints like /markets, /portfolio, /wallet, etc.',
      frontendUrl: 'http://localhost:3050',
    };
  }
}
