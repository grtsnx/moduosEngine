export function passkey(options?: unknown): { id: string; options?: unknown } {
  return options === undefined ? { id: 'passkey' } : { id: 'passkey', options };
}
