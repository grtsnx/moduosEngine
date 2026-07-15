import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  customQueueJobName,
  customQueueJobPayload,
  sendEmailJobPayload,
} from '../../fixtures';
import { QueueService } from 'src/middleware';

const mockQueueAdd = jest.fn().mockResolvedValue(undefined);
const mockQueueClose = jest.fn().mockResolvedValue(undefined);

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: mockQueueClose,
  })),
}));

describe('QueueService', () => {
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
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('is disabled when REDIS_URL is unset', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => ''),
          },
        },
      ],
    }).compile();

    const service = module.get(QueueService);
    service.onModuleInit();

    expect(service.isEnabled()).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      'REDIS_URL not set; queue operations are disabled',
    );
    await expect(service.enqueueEmailSend(sendEmailJobPayload)).resolves.toBe(
      false,
    );
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });

  it('enqueues email job when REDIS_URL is configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'REDIS_URL' ? 'redis://localhost:6379' : '',
            ),
          },
        },
      ],
    }).compile();

    const service = module.get(QueueService);
    service.onModuleInit();

    expect(service.isEnabled()).toBe(true);
    expect(logSpy).toHaveBeenCalledWith('✓ Queue connected');
    await expect(service.enqueueEmailSend(sendEmailJobPayload)).resolves.toBe(
      true,
    );
    const firstCall = mockQueueAdd.mock.calls[0] as [string, unknown, unknown];
    expect(firstCall[0]).toBe('email.send');
    expect(firstCall[1]).toEqual(sendEmailJobPayload);
    const options = firstCall[2] as { jobId?: unknown };
    expect(typeof options.jobId).toBe('string');
  });

  it('enqueue adds custom job names when queue is enabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'REDIS_URL' ? 'redis://localhost:6379' : '',
            ),
          },
        },
      ],
    }).compile();

    const service = module.get(QueueService);
    service.onModuleInit();

    await expect(
      service.enqueue(customQueueJobName, customQueueJobPayload),
    ).resolves.toBe(true);

    const firstCall = mockQueueAdd.mock.calls[0] as [string, unknown, unknown];
    expect(firstCall[0]).toBe(customQueueJobName);
    expect(firstCall[1]).toEqual(customQueueJobPayload);
    const options = firstCall[2] as { jobId?: unknown };
    expect(typeof options.jobId).toBe('string');
  });

  it('rejects malformed payloads', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'REDIS_URL' ? 'redis://localhost:6379' : '',
            ),
          },
        },
      ],
    }).compile();

    const service = module.get(QueueService);
    service.onModuleInit();

    const malformedPayload = {
      ...sendEmailJobPayload,
      to: 'not-an-email',
    };

    await expect(
      service.enqueueEmailSend(malformedPayload),
    ).resolves.toBeFalsy();
    expect(mockQueueAdd).not.toHaveBeenCalled();
  });
});
