import { SetMetadata } from '@nestjs/common';

let lastForRootAsyncOptions: Record<string, unknown> | undefined;

export const AllowAnonymous = (): ClassDecorator & MethodDecorator =>
  SetMetadata('allowAnonymous', true);

export const OptionalAuth = (): ClassDecorator & MethodDecorator =>
  SetMetadata('optionalAuth', true);

export const Roles = (...roles: string[]): ClassDecorator & MethodDecorator =>
  SetMetadata('roles', roles);

export const Session = (): ParameterDecorator => () => undefined;

export class AuthModule {
  static forRoot(): Record<string, unknown> {
    return { module: AuthModule };
  }

  static forRootAsync(
    options?: Record<string, unknown>,
  ): Record<string, unknown> {
    lastForRootAsyncOptions = options;
    return { module: AuthModule };
  }
}

export class AuthGuard {
  canActivate(): boolean {
    return true;
  }
}

export function getLastForRootAsyncOptions():
  Record<string, unknown> | undefined {
  return lastForRootAsyncOptions;
}

export function resetLastForRootAsyncOptions(): void {
  lastForRootAsyncOptions = undefined;
}
