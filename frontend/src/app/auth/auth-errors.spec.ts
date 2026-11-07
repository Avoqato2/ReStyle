import { AuthApiError, AuthRetryableFetchError, AuthWeakPasswordError } from '@supabase/supabase-js';

import { AUTH_ERROR_MESSAGES, authError, mapAuthError } from './auth-errors';

describe('mapAuthError', () => {
  it.each([
    ['invalid_credentials', 'invalid_credentials'],
    ['email_not_confirmed', 'email_not_confirmed'],
    ['weak_password', 'weak_password'],
    ['over_email_send_rate_limit', 'rate_limited'],
    ['over_request_rate_limit', 'rate_limited'],
    ['request_timeout', 'network'],
    ['user_banned', 'unknown'],
  ] as const)('maps Supabase code %s to %s', (supabaseCode, expected) => {
    const result = mapAuthError(new AuthApiError('irrelevant', 400, supabaseCode));

    expect(result).toEqual({ code: expected, message: AUTH_ERROR_MESSAGES[expected] });
  });

  it('maps AuthWeakPasswordError to weak_password', () => {
    expect(mapAuthError(new AuthWeakPasswordError('weak', 422, ['length'])).code).toBe('weak_password');
  });

  it('maps retryable fetch errors to network', () => {
    expect(mapAuthError(new AuthRetryableFetchError('Failed to fetch', 0)).code).toBe('network');
  });

  it('maps a plain fetch TypeError to network', () => {
    expect(mapAuthError(new TypeError('Failed to fetch')).code).toBe('network');
  });

  it('maps everything else to unknown', () => {
    expect(mapAuthError(new Error('boom')).code).toBe('unknown');
    expect(mapAuthError(undefined).code).toBe('unknown');
  });

  it('does not leak the Supabase message to the UI', () => {
    const result = mapAuthError(new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'));

    expect(result.message).not.toContain('Invalid');
  });
});

describe('authError', () => {
  it('provides a German message for every code', () => {
    for (const code of Object.keys(AUTH_ERROR_MESSAGES) as (keyof typeof AUTH_ERROR_MESSAGES)[]) {
      expect(authError(code).message.length).toBeGreaterThan(0);
    }
  });
});
