export function sampleAuthSuccess(
  message: string,
  data: Record<string, unknown> = { success: true },
) {
  return {
    statusCode: 200,
    statusType: 'OK' as const,
    message,
    data,
  };
}
