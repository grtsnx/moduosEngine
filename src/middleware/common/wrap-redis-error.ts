export function wrapRedisError(operation: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`Error ${operation} in Redis: ${message}`, { cause: error });
}
