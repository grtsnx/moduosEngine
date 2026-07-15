import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient | null;

  constructor(private readonly configService: ConfigService) {
    const connectionString =
      this.configService.get<string>('DATABASE_URL')?.trim() ?? '';
    this.prisma = connectionString
      ? new PrismaClient({
          adapter: new PrismaPg({
            connectionString,
            keepAlive: true,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
          }),
        })
      : null;
  }

  isEnabled(): boolean {
    return this.prisma !== null;
  }

  client(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database is not configured (DATABASE_URL is unset)');
    }
    return this.prisma;
  }

  async ping(): Promise<boolean> {
    if (!this.prisma) {
      return false;
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.prisma) {
      this.logger.warn(
        'DATABASE_URL not set; database operations are disabled',
      );
      return;
    }

    await this.prisma.$connect();
    this.logger.log('✓ Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }
}
