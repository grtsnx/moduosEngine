import { bootstrapWorker } from 'src/middleware/worker/bootstrap-worker';
import { WorkerModule } from 'src/middleware/worker/worker.module';

const createApplicationContext = jest.fn();

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    get createApplicationContext() {
      return createApplicationContext;
    },
  },
}));

describe('bootstrapWorker', () => {
  it('creates an application context and logs startup', async () => {
    const logger = { log: jest.fn() };
    const app = {
      enableShutdownHooks: jest.fn(),
      useLogger: jest.fn(),
      get: jest.fn().mockReturnValue(logger),
    };

    createApplicationContext.mockResolvedValue(app);

    await bootstrapWorker();

    expect(createApplicationContext).toHaveBeenCalledWith(WorkerModule, {
      logger: ['error', 'warn', 'log', 'fatal'],
    });
    expect(app.enableShutdownHooks).toHaveBeenCalled();
    expect(app.useLogger).toHaveBeenCalledWith(logger);
    expect(logger.log).toHaveBeenCalledWith('Email worker started');
  });
});
