import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Item } from 'generated/prisma/client';
import { AppService } from './app.service';
import { LIMIT } from './constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('items')
  getItems(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('limit', new DefaultValuePipe(LIMIT), ParseIntPipe) take: number,
    @Query('name', new DefaultValuePipe('')) name: string,
  ): Promise<Item[]> {
    return this.appService.getItems({ skip, take, name });
  }
}
