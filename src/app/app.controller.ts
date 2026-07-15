import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { AppService } from './app.service';
import { handleResponse } from 'src/middleware';

@ApiTags('Server')
@AllowAnonymous()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  getHello(): never {
    throw new handleResponse(200, 'OK', {
      message: this.appService.getHello(),
    });
  }

  @SkipThrottle({ default: true })
  @Get('health')
  @ApiOperation({ summary: 'Liveness check' })
  getHealth(): never {
    return this.appService.getHealth();
  }

  @SkipThrottle({ default: true })
  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness check (Redis + queue + database)' })
  async getReadiness(): Promise<never> {
    return this.appService.getReadiness();
  }
}
