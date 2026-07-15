let lastConfig: Record<string, unknown> | null = null;

export function betterAuth(config: Record<string, unknown>): {
  handler: () => void;
  $Infer: { Session: unknown };
  api: {
    sendVerificationOTP: jest.Mock;
  };
} {
  lastConfig = config;
  return {
    handler: () => undefined,
    $Infer: { Session: {} },
    api: {
      sendVerificationOTP: jest.fn().mockResolvedValue({ success: true }),
    },
    ...config,
  };
}

export function getLastBetterAuthConfig(): Record<string, unknown> | null {
  return lastConfig;
}

export function resetLastBetterAuthConfig(): void {
  lastConfig = null;
}
