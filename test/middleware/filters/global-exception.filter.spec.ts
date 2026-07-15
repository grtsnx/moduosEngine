import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

import { GlobalExceptionFilter, handleResponse } from 'src/middleware';

describe('GlobalExceptionFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  };

  it('passes through handleResponse unchanged', () => {
    const filter = new GlobalExceptionFilter(false);
    const { host, status, json } = createHost();
    const error = new handleResponse(200, 'OK', { status: 'up' });

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(error.getResponse());
  });

  it('maps validation errors from HttpException objects', () => {
    const filter = new GlobalExceptionFilter(false);
    const { host, status, json } = createHost();

    filter.catch(
      new HttpException(
        {
          message: ['email must be valid', 'name is required'],
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      statusType: 'BAD_REQUEST',
      message: 'Validation failed',
      data: { errors: ['email must be valid', 'name is required'] },
    });
  });

  it('maps HttpException to handleResponse shape', () => {
    const filter = new GlobalExceptionFilter(false);
    const { host, status, json } = createHost();

    filter.catch(
      new HttpException('Bad request', HttpStatus.BAD_REQUEST),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      statusType: 'BAD_REQUEST',
      message: 'Bad request',
    });
  });

  it('hides stack traces in production for unknown errors', () => {
    const filter = new GlobalExceptionFilter(true);
    const { host, json } = createHost();

    filter.catch(new Error('Database exploded'), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      statusType: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });

  it('includes stack traces in development for unknown errors', () => {
    const filter = new GlobalExceptionFilter(false);
    const { host, json } = createHost();
    const error = new Error('Database exploded');

    filter.catch(error, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Database exploded',
        data: { stack: error.stack },
      }),
    );
  });
});
