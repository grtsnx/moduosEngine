import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { processorEmailJobPayload, unknownQueueJobName } from '../../fixtures';
import { SendMailsService } from 'src/lib';
import { EmailProcessor } from 'src/middleware/queue/email.processor';

const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn().mockResolvedValue(undefined);

type EmailJobHandler = (job: {
  name: string;
  data: Record<string, unknown>;
}) => Promise<void>;

let capturedJobHandler: EmailJobHandler | null = null;

jest.mock('bullmq', () => ({
  Worker: jest
    .fn()
    .mockImplementation((_queue: string, processor: EmailJobHandler) => {
      capturedJobHandler = processor;
      return {
        on: mockWorkerOn,
        close: mockWorkerClose,
      };
    }),
}));

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let sendMailsService: { sendEmail: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    capturedJobHandler = null;
    sendMailsService = { sendEmail: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'REDIS_URL') {
                return 'redis://localhost:6379';
              }
              if (key === 'NODE_ENV') {
                return 'development';
              }
              return '';
            }),
          },
        },
        {
          provide: SendMailsService,
          useValue: sendMailsService,
        },
      ],
    }).compile();

    processor = module.get(EmailProcessor);
  });

  it('starts worker when redis is configured outside test env', () => {
    processor.onModuleInit();
    expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
  });

  it('processes email.send jobs via worker handler', async () => {
    processor.onModuleInit();

    await capturedJobHandler?.({
      name: 'email.send',
      data: processorEmailJobPayload,
    });

    expect(sendMailsService.sendEmail).toHaveBeenCalledWith(
      processorEmailJobPayload.to,
      processorEmailJobPayload.subject,
      processorEmailJobPayload.template,
      processorEmailJobPayload.context,
    );
  });

  it('ignores unknown job names', async () => {
    processor.onModuleInit();

    await capturedJobHandler?.({
      name: unknownQueueJobName,
      data: processorEmailJobPayload,
    });

    expect(sendMailsService.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects malformed payloads', async () => {
    processor.onModuleInit();

    await capturedJobHandler?.({
      name: 'email.send',
      data: {
        ...processorEmailJobPayload,
        to: 'invalid-address',
      },
    });

    expect(sendMailsService.sendEmail).not.toHaveBeenCalled();
  });

  it('skips worker startup in test environment', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'NODE_ENV' ? 'test' : 'redis://localhost:6379',
            ),
          },
        },
        {
          provide: SendMailsService,
          useValue: sendMailsService,
        },
      ],
    }).compile();

    module.get(EmailProcessor).onModuleInit();
    expect(mockWorkerOn).not.toHaveBeenCalled();
  });

  it('skips worker startup when REDIS_URL is unset', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'NODE_ENV' ? 'development' : '',
            ),
          },
        },
        {
          provide: SendMailsService,
          useValue: sendMailsService,
        },
      ],
    }).compile();

    module.get(EmailProcessor).onModuleInit();
    expect(mockWorkerOn).not.toHaveBeenCalled();
  });

  it('closes worker on module destroy', async () => {
    processor.onModuleInit();
    await processor.onModuleDestroy();
    expect(mockWorkerClose).toHaveBeenCalled();
  });
});
