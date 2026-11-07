import { parseCallbackUrl } from '../services/auth/auth-callback';

describe('parseCallbackUrl', () => {
  it.each(['signup', 'recovery', 'google'] as const)('reads flow %s and code from the custom scheme', (flow) => {
    expect(parseCallbackUrl(`restyle://auth/callback?flow=${flow}&code=abc123`)).toEqual({ flow, code: 'abc123' });
  });

  it('reads the web callback route', () => {
    expect(parseCallbackUrl('http://localhost:8100/auth/callback?flow=signup&code=xyz')).toEqual({
      flow: 'signup',
      code: 'xyz',
    });
  });

  it('accepts a base href in front of the web callback route', () => {
    expect(parseCallbackUrl('https://example.github.io/ReStyle/auth/callback?flow=recovery&code=c')?.flow).toBe(
      'recovery',
    );
  });

  it('reads errors from the query', () => {
    expect(parseCallbackUrl('restyle://auth/callback?flow=google&error=access_denied')).toEqual({
      flow: 'google',
      error: { name: 'access_denied' },
    });
  });

  it('reads errors from the fragment', () => {
    const url =
      'restyle://auth/callback?flow=signup#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid';

    expect(parseCallbackUrl(url)).toEqual({
      flow: 'signup',
      error: { name: 'access_denied', code: 'otp_expired', description: 'Email link is invalid' },
    });
  });

  it('uses error_code alone as error name', () => {
    expect(parseCallbackUrl('restyle://auth/callback?flow=signup&error_code=otp_expired')?.error).toEqual({
      name: 'otp_expired',
      code: 'otp_expired',
    });
  });

  it('ignores the code when an error is present', () => {
    expect(parseCallbackUrl('restyle://auth/callback?flow=signup&code=abc&error=server_error')?.code).toBeUndefined();
  });

  it('returns only the flow when neither code nor error is present', () => {
    expect(parseCallbackUrl('restyle://auth/callback?flow=recovery')).toEqual({ flow: 'recovery' });
  });

  it.each([
    'restyle://auth/callback?code=abc',
    'restyle://auth/callback?flow=magiclink&code=abc',
    'restyle://other/path?flow=signup&code=abc',
    'http://localhost:8100/home?flow=signup&code=abc',
    'not a url',
    '',
  ])('returns null for %s', (url) => {
    expect(parseCallbackUrl(url)).toBeNull();
  });
});
