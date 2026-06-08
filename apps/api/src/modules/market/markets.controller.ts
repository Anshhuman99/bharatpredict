import { Controller, Get, Param } from '@nestjs/common';
import { MarketsService } from './markets.service';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  async findAll() {
    return await this.marketsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.marketsService.findOne(id);
  }
}
