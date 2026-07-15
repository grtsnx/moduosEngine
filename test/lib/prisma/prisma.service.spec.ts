import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { databaseUrlFixtures } from '../../fixtures';
import {
  mockPrismaConnect,
  mockPrismaDisconnect,
  mockPrismaQueryRaw,
} from '../../mocks/prisma-client.mock';
import { PrismaService } from 'src/lib';

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'DATABASE_URL' ? databaseUrlFixtures.valid : '',
            ),
          },
        },
      ],
    }).compile();

    service = module.get(PrismaService);
  });

  it('reports enabled when DATABASE_URL is configured', () => {
    expect(service.isEnabled()).toBe(true);
  });

  it('ping returns true when database responds', async () => {
    await expect(service.ping()).resolves.toBe(true);
    expect(mockPrismaQueryRaw).toHaveBeenCalled();
  });

  it('ping returns false when database is disabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => databaseUrlFixtures.unset),
          },
        },
      ],
    }).compile();

    await expect(module.get(PrismaService).ping()).resolves.toBe(false);
  });

  it('ping returns false when query throws', async () => {
    mockPrismaQueryRaw.mockRejectedValueOnce(new Error('connection refused'));
    await expect(service.ping()).resolves.toBe(false);
  });

  it('client returns PrismaClient when enabled', () => {
    const client = service.client();
    expect(client).toBeDefined();
    expect(typeof client.$connect).toBe('function');
  });

  it('client throws when DATABASE_URL is unset', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => databaseUrlFixtures.unset),
          },
        },
      ],
    }).compile();

    expect(() => module.get(PrismaService).client()).toThrow(
      'Database is not configured (DATABASE_URL is unset)',
    );
  });

  it('connects on module init when enabled', async () => {
    await service.onModuleInit();
    expect(mockPrismaConnect).toHaveBeenCalled();
  });

  describe('onModuleInit logging', () => {
    let logSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);
      warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('logs connected when database is enabled', async () => {
      await service.onModuleInit();
      expect(logSpy).toHaveBeenCalledWith('✓ Database connected');
    });

    it('warns when DATABASE_URL is unset', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PrismaService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => databaseUrlFixtures.unset),
            },
          },
        ],
      }).compile();

      await module.get(PrismaService).onModuleInit();

      expect(warnSpy).toHaveBeenCalledWith(
        'DATABASE_URL not set; database operations are disabled',
      );
    });
  });

  it('disconnects on module destroy when enabled', async () => {
    await service.onModuleDestroy();
    expect(mockPrismaDisconnect).toHaveBeenCalled();
  });

  it('onModuleInit is safe when database is disabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => databaseUrlFixtures.unset),
          },
        },
      ],
    }).compile();

    const disabledService = module.get(PrismaService);
    await expect(disabledService.onModuleInit()).resolves.toBeUndefined();
  });

  it('onModuleDestroy is safe when database is disabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => databaseUrlFixtures.unset),
          },
        },
      ],
    }).compile();

    await expect(
      module.get(PrismaService).onModuleDestroy(),
    ).resolves.toBeUndefined();
  });

  it('is disabled when DATABASE_URL is whitespace', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => databaseUrlFixtures.whitespace),
          },
        },
      ],
    }).compile();

    expect(module.get(PrismaService).isEnabled()).toBe(false);
  });
});
