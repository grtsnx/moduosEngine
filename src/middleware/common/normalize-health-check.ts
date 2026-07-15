import type {
  HealthCheckResult,
  HealthCheckStatus,
  HealthIndicatorResult,
} from '@nestjs/terminus';

export type ReadinessPayload = {
  status: HealthCheckStatus;
  checks: HealthIndicatorResult;
};

function isHealthCheckResult(value: unknown): value is HealthCheckResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'details' in value
  );
}

export function normalizeReadinessPayload(
  payload: HealthCheckResult | HealthIndicatorResult,
): ReadinessPayload {
  if (isHealthCheckResult(payload)) {
    return {
      status: payload.status,
      checks: payload.details,
    };
  }

  return {
    status: 'error',
    checks: payload,
  };
}
