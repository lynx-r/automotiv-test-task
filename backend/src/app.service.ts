import { Injectable } from '@nestjs/common';
import { Item } from 'generated/prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello() {
    return 'Hello World!';
  }

  getItems(params: {
    skip: number;
    take: number;
    name: string;
  }): Promise<Item[]> {
    const { skip, take, name } = params;
    return this.prisma.item.findMany({
      skip,
      take,
      where: { name: { contains: name } },
    });
  }
}
