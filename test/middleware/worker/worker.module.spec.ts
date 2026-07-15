import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from 'src/app';
import { WorkerModule } from 'src/middleware';

const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn().mockResolvedValue(undefined);

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('WorkerModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('compiles as a standalone application context (no HTTP)', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WorkerModule],
    }).compile();

    expect(module).toBeDefined();
  });
});

describe('AppModule vs worker split', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not start BullMQ workers when only the API module boots', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await module.init();

    expect(mockWorkerOn).not.toHaveBeenCalled();
    await module.close();
  });
});
