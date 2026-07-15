import { Injectable, OnModuleInit } from '@nestjs/common';

import { SendMailsService, setAuthMailService } from 'src/lib';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly sendMailsService: SendMailsService) {}

  onModuleInit(): void {
    setAuthMailService(this.sendMailsService);
  }
}
