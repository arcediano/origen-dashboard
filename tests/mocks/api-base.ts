const FALLBACK_TEST_ORIGIN = 'http://localhost:3001';

export const TEST_APP_ORIGIN =
  typeof window !== 'undefined' && window.location.origin !== 'null'
    ? window.location.origin
    : FALLBACK_TEST_ORIGIN;

export const TEST_API_BASE = `${TEST_APP_ORIGIN}/api/v1`;