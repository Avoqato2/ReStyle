import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import {
  AuthApiError,
  AuthPKCECodeVerifierMissingError,
  AuthWeakPasswordError,
  type AuthChangeEvent,
  type Session,
} from '@supabase/supabase-js';
import { Browser } from '@capacitor/browser';
import type { MockInstance } from 'vitest';

import { authError } from '../services/auth/auth-errors';
import { SUPABASE_CLIENT } from '../supabase.client';
import { AuthService, GOOGLE_CANCEL_GRACE_MS, normalizeEmail, type AuthCallbackEvent } from '../services/auth/auth.service';

vi.mock('@capacitor/browser', () => ({
  Browser: { open: vi.fn(), close: vi.fn(), addListener: vi.fn() },
}));

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

function fakeSession(id = 'user-1', email = 'anna@example.com'): Session {
  return {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id, email, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
  } as Session;
}

function createAuthMock() {
  let listener: AuthListener | undefined;

  const auth = {
    onAuthStateChange: vi.fn((callback: AuthListener) => {
      listener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ data: { session: fakeSession(), user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: fakeSession().user, session: null }, error: null }),
    resend: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: fakeSession().user, session: fakeSession() },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: fakeSession().user }, error: null }),
    signInWithOAuth: vi.fn().mockResolvedValue({
      data: { provider: 'google', url: 'https://supabase.test/auth/v1/authorize?provider=google' },
      error: null,
    }),
  };

  return {
    auth,
    emit: (event: AuthChangeEvent, session: Session | null) => listener?.(event, session),
  };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('AuthService', () => {
  let mock: ReturnType<typeof createAuthMock>;

  let navigate: MockInstance<Router['navigateByUrl']>;

  function createService(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SUPABASE_CLIENT, useValue: { auth: mock.auth } }],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    mock = createAuthMock();
  });

  describe('initialisation', () => {
    it('starts with status initializing and empty signals', () => {
      mock.auth.getSession.mockReturnValue(new Promise(() => undefined));
      const service = createService();

      expect(service.status()).toBe('initializing');
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.signOutReason()).toBeNull();
      expect(service.signupResend()).toBeNull();
      expect(service.recoveryResend()).toBeNull();
    });

    it('becomes authenticated with a stored session', async () => {
      mock.auth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
      const service = createService();
      await flush();

      expect(service.status()).toBe('authenticated');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.user()).toEqual({ id: 'user-1', email: 'anna@example.com' });
    });

    it('becomes unauthenticated without a stored session', async () => {
      const service = createService();
      await flush();

      expect(service.status()).toBe('unauthenticated');
      expect(service.user()).toBeNull();
    });

    it('becomes unauthenticated when getSession returns an error', async () => {
      mock.auth.getSession.mockResolvedValue({ data: { session: null }, error: new Error('broken') });
      const service = createService();
      await flush();

      expect(service.status()).toBe('unauthenticated');
    });

    it('becomes unauthenticated when getSession throws', async () => {
      mock.auth.getSession.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();
      await flush();

      expect(service.status()).toBe('unauthenticated');
    });
  });

  describe('onAuthStateChange', () => {
    it('follows sessions reported by supabase-js', async () => {
      const service = createService();
      await flush();

      mock.emit('SIGNED_IN', fakeSession('user-2', 'ben@example.com'));
      expect(service.status()).toBe('authenticated');
      expect(service.user()).toEqual({ id: 'user-2', email: 'ben@example.com' });

      mock.emit('TOKEN_REFRESHED', fakeSession('user-2', 'ben@example.com'));
      expect(service.status()).toBe('authenticated');
    });
  });

  describe('handleCallbackUrl', () => {
    const exchangeFails = () =>
      mock.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null, user: null },
        error: new AuthPKCECodeVerifierMissingError(),
      });

    it.each([
      ['signup', { type: 'email_confirmed' }],
      ['recovery', { type: 'password_recovery' }],
      ['google', { type: 'oauth_signed_in' }],
    ] as const)('exchanges the code for flow %s', async (flow, expected) => {
      const service = createService();
      await flush();

      const event = await service.handleCallbackUrl(`restyle://auth/callback?flow=${flow}&code=abc`);

      expect(mock.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc');
      expect(event).toEqual(expected);
      expect(service.status()).toBe('authenticated');
    });

    it('emits the event on callbackEvents', async () => {
      const service = createService();
      const events: AuthCallbackEvent[] = [];
      service.callbackEvents.subscribe((event) => events.push(event));

      await service.handleCallbackUrl('restyle://auth/callback?flow=signup&code=abc');

      expect(events).toEqual([{ type: 'email_confirmed' }]);
    });

    it.each(['signup', 'recovery'] as const)('maps a callback error for %s to link_invalid', async (flow) => {
      const service = createService();

      const event = await service.handleCallbackUrl(`restyle://auth/callback?flow=${flow}&error_code=otp_expired`);

      expect(event).toEqual({ type: 'link_invalid', flow });
      expect(mock.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('maps a Google access_denied to oauth_cancelled', async () => {
      const service = createService();

      expect(await service.handleCallbackUrl('restyle://auth/callback?flow=google&error=access_denied')).toEqual({
        type: 'oauth_cancelled',
      });
    });

    it('maps other Google errors to oauth_failed with a German message', async () => {
      const service = createService();

      const event = await service.handleCallbackUrl('restyle://auth/callback?flow=google&error=server_error');

      expect(event).toEqual({ type: 'oauth_failed', error: authError('oauth_failed') });
    });

    it('asks for login when the signup code cannot be exchanged on this device', async () => {
      exchangeFails();
      const service = createService();
      await flush();

      expect(await service.handleCallbackUrl('restyle://auth/callback?flow=signup&code=abc')).toEqual({
        type: 'email_confirmed_login_required',
      });
      expect(service.status()).toBe('unauthenticated');
    });

    it('maps a failed recovery exchange to link_invalid', async () => {
      exchangeFails();
      const service = createService();

      expect(await service.handleCallbackUrl('restyle://auth/callback?flow=recovery&code=abc')).toEqual({
        type: 'link_invalid',
        flow: 'recovery',
      });
    });

    it('maps a failed Google exchange to oauth_failed', async () => {
      exchangeFails();
      const service = createService();

      expect(await service.handleCallbackUrl('restyle://auth/callback?flow=google&code=abc')).toEqual({
        type: 'oauth_failed',
        error: authError('oauth_failed'),
      });
    });

    it('keeps a network error for a failed Google exchange', async () => {
      mock.auth.exchangeCodeForSession.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.handleCallbackUrl('restyle://auth/callback?flow=google&code=abc')).toEqual({
        type: 'oauth_failed',
        error: authError('network'),
      });
    });

    it.each([
      ['signup', { type: 'link_invalid', flow: 'signup' }],
      ['recovery', { type: 'link_invalid', flow: 'recovery' }],
      ['google', { type: 'oauth_failed', error: authError('oauth_failed') }],
    ] as const)('treats flow %s without code and error as invalid', async (flow, expected) => {
      const service = createService();

      expect(await service.handleCallbackUrl(`restyle://auth/callback?flow=${flow}`)).toEqual(expected);
    });

    it('treats an unparseable callback as an invalid signup link', async () => {
      const service = createService();

      expect(await service.handleCallbackUrl('restyle://auth/callback?code=abc')).toEqual({
        type: 'link_invalid',
        flow: 'signup',
      });
    });

    it('ignores the same URL a second time', async () => {
      const service = createService();
      const events: AuthCallbackEvent[] = [];
      service.callbackEvents.subscribe((event) => events.push(event));
      const url = 'restyle://auth/callback?flow=signup&code=abc';

      const first = await service.handleCallbackUrl(url);
      const second = await service.handleCallbackUrl(url);

      expect(second).toEqual(first);
      expect(mock.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
      expect(events).toHaveLength(1);
    });
  });

  describe('signUp', () => {
    it('registers with the signup redirect', async () => {
      const service = createService();

      const result = await service.signUp(' anna@example.com ', 'abcd1234');

      expect(result).toEqual({ ok: true, data: undefined });
      expect(mock.auth.signUp).toHaveBeenCalledWith({
        email: 'anna@example.com',
        password: 'abcd1234',
        options: { emailRedirectTo: 'restyle://auth/callback?flow=signup' },
      });
    });

    it('reports success for an already registered email (FR-006)', async () => {
      mock.auth.signUp.mockResolvedValue({
        data: { user: { ...fakeSession().user, identities: [] }, session: null },
        error: null,
      });
      const service = createService();

      expect(await service.signUp('anna@example.com', 'abcd1234')).toEqual({ ok: true, data: undefined });
    });

    it.each(['user_already_exists', 'email_exists'])(
      'reports success for %s without email confirmation (FR-006)',
      async (code) => {
        mock.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: new AuthApiError('User already registered', 422, code),
        });
        const service = createService();

        expect(await service.signUp('anna@example.com', 'abcd1234')).toEqual({ ok: true, data: undefined });
      },
    );

    it('maps a weak password', async () => {
      mock.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new AuthWeakPasswordError('weak', 422, ['characters']),
      });
      const service = createService();

      expect(await service.signUp('anna@example.com', 'abc')).toEqual({ ok: false, error: authError('weak_password') });
    });

    it('maps a rate limit', async () => {
      mock.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new AuthApiError('limit', 429, 'over_email_send_rate_limit'),
      });
      const service = createService();

      expect(await service.signUp('anna@example.com', 'abcd1234')).toEqual({
        ok: false,
        error: authError('rate_limited'),
      });
    });

    it('maps a thrown network error', async () => {
      mock.auth.signUp.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.signUp('anna@example.com', 'abcd1234')).toEqual({ ok: false, error: authError('network') });
    });

    it('reuses the running promise for repeated calls', async () => {
      const service = createService();

      const first = service.signUp('anna@example.com', 'abcd1234');
      const second = service.signUp('anna@example.com', 'abcd1234');

      expect(second).toBe(first);
      await first;
      expect(mock.auth.signUp).toHaveBeenCalledTimes(1);

      await service.signUp('anna@example.com', 'abcd1234');
      expect(mock.auth.signUp).toHaveBeenCalledTimes(2);
    });
  });

  describe('resendConfirmation', () => {
    const now = new Date('2026-11-07T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resends the signup mail with the signup redirect', async () => {
      const service = createService();

      expect(await service.resendConfirmation('anna@example.com')).toEqual({ ok: true, data: undefined });
      expect(mock.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'anna@example.com',
        options: { emailRedirectTo: 'restyle://auth/callback?flow=signup' },
      });
    });

    it('starts the countdown for the normalized address on success', async () => {
      const service = createService();

      await service.resendConfirmation(' Anna@Example.com ');

      expect(service.signupResend()).toEqual({
        email: 'anna@example.com',
        availableAt: new Date(now.getTime() + 60_000),
      });
    });

    it('starts the countdown on rate_limited too', async () => {
      mock.auth.resend.mockResolvedValue({
        data: {},
        error: new AuthApiError('limit', 429, 'over_email_send_rate_limit'),
      });
      const service = createService();

      expect(await service.resendConfirmation('anna@example.com')).toEqual({
        ok: false,
        error: authError('rate_limited'),
      });
      expect(service.signupResend()?.email).toBe('anna@example.com');
    });

    it('does not start the countdown on a network error', async () => {
      mock.auth.resend.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.resendConfirmation('anna@example.com')).toEqual({ ok: false, error: authError('network') });
      expect(service.signupResend()).toBeNull();
    });

    it('does not touch recoveryResend', async () => {
      const service = createService();

      await service.resendConfirmation('anna@example.com');

      expect(service.recoveryResend()).toBeNull();
    });

    it('reuses the running promise for repeated calls', () => {
      const service = createService();

      expect(service.resendConfirmation('anna@example.com')).toBe(service.resendConfirmation('anna@example.com'));
    });
  });

  describe('signIn', () => {
    const rejectWith = (error: Error) =>
      mock.auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error });

    it('signs in and becomes authenticated', async () => {
      const service = createService();
      await flush();

      expect(await service.signIn(' anna@example.com', 'abcd1234')).toEqual({ ok: true, data: undefined });
      expect(mock.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'anna@example.com', password: 'abcd1234' });
      expect(service.status()).toBe('authenticated');
      expect(service.user()?.id).toBe('user-1');
    });

    it('returns the same neutral error for wrong password and unknown email (FR-008)', async () => {
      rejectWith(new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'));
      const service = createService();

      const result = await service.signIn('unknown@example.com', 'abcd1234');

      expect(result).toEqual({ ok: false, error: authError('invalid_credentials') });
    });

    it('reports an unconfirmed email', async () => {
      rejectWith(new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'));
      const service = createService();

      expect(await service.signIn('anna@example.com', 'abcd1234')).toEqual({
        ok: false,
        error: authError('email_not_confirmed'),
      });
    });

    it('maps a thrown network error', async () => {
      mock.auth.signInWithPassword.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.signIn('anna@example.com', 'abcd1234')).toEqual({ ok: false, error: authError('network') });
    });

    it('reuses the running promise for repeated calls', () => {
      const service = createService();

      expect(service.signIn('a@example.com', 'abcd1234')).toBe(service.signIn('a@example.com', 'abcd1234'));
    });
  });

  describe('signOut', () => {
    async function signedInService(): Promise<AuthService> {
      mock.auth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
      const service = createService();
      await flush();
      return service;
    }

    it('signs out locally, clears the user and navigates to the login', async () => {
      const service = await signedInService();

      await service.signOut();

      expect(mock.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(service.status()).toBe('unauthenticated');
      expect(service.user()).toBeNull();
      expect(service.signOutReason()).toBe('user');
      expect(navigate).toHaveBeenCalledWith('/auth/login');
    });

    it('runs registered cleanup hooks after the logout, in order', async () => {
      const service = await signedInService();
      const calls: string[] = [];
      mock.auth.signOut.mockImplementation(async () => {
        calls.push('signOut');
        return { error: null };
      });
      service.registerSignOutCleanup(() => {
        calls.push('sync');
      });
      service.registerSignOutCleanup(async () => {
        calls.push('async');
      });

      await service.signOut();

      expect(calls).toEqual(['signOut', 'sync', 'async']);
    });

    it('keeps running cleanups when one fails', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const service = await signedInService();
      const second = vi.fn();
      service.registerSignOutCleanup(() => {
        throw new Error('cache broken');
      });
      service.registerSignOutCleanup(second);

      await service.signOut();

      expect(second).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/auth/login');
      error.mockRestore();
    });

    it('still signs out locally when supabase throws', async () => {
      mock.auth.signOut.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = await signedInService();

      await service.signOut();

      expect(service.status()).toBe('unauthenticated');
      expect(navigate).toHaveBeenCalledWith('/auth/login');
    });

    it('reuses the running promise for repeated calls', async () => {
      const service = await signedInService();

      const first = service.signOut();
      expect(service.signOut()).toBe(first);
      await first;
      expect(mock.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('expired session (SIGNED_OUT without signOut)', () => {
    it('sets signOutReason expired and navigates to the login', async () => {
      mock.auth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
      const service = createService();
      await flush();

      mock.emit('SIGNED_OUT', null);

      expect(service.status()).toBe('unauthenticated');
      expect(service.signOutReason()).toBe('expired');
      expect(navigate).toHaveBeenCalledWith('/auth/login');
    });

    it('treats an invalid stored session during start-up as expired', () => {
      mock.auth.getSession.mockReturnValue(new Promise(() => undefined));
      const service = createService();

      mock.emit('SIGNED_OUT', null);

      expect(service.signOutReason()).toBe('expired');
    });

    it('ignores SIGNED_OUT while already signed out', async () => {
      const service = createService();
      await flush();

      mock.emit('SIGNED_OUT', null);

      expect(service.signOutReason()).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not report expired for the own signOut()', async () => {
      mock.auth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
      const service = createService();
      await flush();
      mock.auth.signOut.mockImplementation(async () => {
        mock.emit('SIGNED_OUT', null);
        return { error: null };
      });

      await service.signOut();

      expect(service.signOutReason()).toBe('user');
      expect(navigate).toHaveBeenCalledTimes(1);
    });

    it('resets signOutReason after the next successful login', async () => {
      mock.auth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
      const service = createService();
      await flush();
      mock.emit('SIGNED_OUT', null);

      await service.signIn('anna@example.com', 'abcd1234');

      expect(service.signOutReason()).toBeNull();
    });
  });

  describe('requestPasswordReset', () => {
    const now = new Date('2026-11-07T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('requests the reset link with the recovery redirect', async () => {
      const service = createService();

      expect(await service.requestPasswordReset(' anna@example.com ')).toEqual({ ok: true, data: undefined });
      expect(mock.auth.resetPasswordForEmail).toHaveBeenCalledWith('anna@example.com', {
        redirectTo: 'restyle://auth/callback?flow=recovery',
      });
    });

    it('starts the recovery countdown for the normalized address', async () => {
      const service = createService();

      await service.requestPasswordReset('Anna@Example.com');

      expect(service.recoveryResend()).toEqual({
        email: 'anna@example.com',
        availableAt: new Date(now.getTime() + 60_000),
      });
      expect(service.signupResend()).toBeNull();
    });

    it('reports rate_limited and starts the countdown', async () => {
      mock.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: new AuthApiError('limit', 429, 'over_email_send_rate_limit'),
      });
      const service = createService();

      expect(await service.requestPasswordReset('anna@example.com')).toEqual({
        ok: false,
        error: authError('rate_limited'),
      });
      expect(service.recoveryResend()?.email).toBe('anna@example.com');
    });

    it('reports a network error without countdown', async () => {
      mock.auth.resetPasswordForEmail.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.requestPasswordReset('anna@example.com')).toEqual({
        ok: false,
        error: authError('network'),
      });
      expect(service.recoveryResend()).toBeNull();
    });

    it('reports success for any other error, e.g. an unknown address (FR-011)', async () => {
      mock.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: new AuthApiError('User not found', 400, 'user_not_found'),
      });
      const service = createService();

      expect(await service.requestPasswordReset('unknown@example.com')).toEqual({ ok: true, data: undefined });
      expect(service.recoveryResend()?.email).toBe('unknown@example.com');
    });

    it('reuses the running promise for repeated calls', () => {
      const service = createService();

      expect(service.requestPasswordReset('a@example.com')).toBe(service.requestPasswordReset('a@example.com'));
    });
  });

  describe('updatePassword', () => {
    it('updates the password and signs out other devices', async () => {
      const service = createService();

      expect(await service.updatePassword('neu12345')).toEqual({ ok: true, data: undefined });
      expect(mock.auth.updateUser).toHaveBeenCalledWith({ password: 'neu12345' });
      expect(mock.auth.signOut).toHaveBeenCalledWith({ scope: 'others' });
    });

    it('keeps the local session', async () => {
      mock.auth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
      const service = createService();
      await flush();

      await service.updatePassword('neu12345');

      expect(service.status()).toBe('authenticated');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('maps a weak password and does not sign out other devices', async () => {
      mock.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: new AuthWeakPasswordError('weak', 422, ['length']),
      });
      const service = createService();

      expect(await service.updatePassword('kurz')).toEqual({ ok: false, error: authError('weak_password') });
      expect(mock.auth.signOut).not.toHaveBeenCalled();
    });

    it('maps a network error', async () => {
      mock.auth.updateUser.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.updatePassword('neu12345')).toEqual({ ok: false, error: authError('network') });
    });

    it('still succeeds when signing out other devices fails', async () => {
      mock.auth.signOut.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.updatePassword('neu12345')).toEqual({ ok: true, data: undefined });
    });

    it('reuses the running promise for repeated calls', () => {
      const service = createService();

      expect(service.updatePassword('neu12345')).toBe(service.updatePassword('neu12345'));
    });
  });

  describe('signInWithGoogle', () => {
    let browserFinished: (() => void) | undefined;
    let removeFinished: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      removeFinished = vi.fn().mockResolvedValue(undefined);
      vi.mocked(Browser.open).mockResolvedValue(undefined);
      vi.mocked(Browser.close).mockResolvedValue(undefined);
      vi.mocked(Browser.addListener).mockImplementation((async (_event: string, listener: () => void) => {
        browserFinished = listener;
        return { remove: removeFinished };
      }) as unknown as typeof Browser.addListener);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.mocked(Browser.open).mockReset();
      vi.mocked(Browser.close).mockReset();
      vi.mocked(Browser.addListener).mockReset();
      browserFinished = undefined;
    });

    // Startet den Google-Login; das Ergebnis bleibt offen, bis Callback oder browserFinished kommt.
    const startGoogle = (service: AuthService) => service.signInWithGoogle();

    it('opens the OAuth URL in the in-app browser', async () => {
      const service = createService();

      void startGoogle(service);
      await vi.waitFor(() => expect(Browser.open).toHaveBeenCalled());

      expect(mock.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: { redirectTo: 'restyle://auth/callback?flow=google', skipBrowserRedirect: true },
      });
      expect(Browser.open).toHaveBeenCalledWith({ url: 'https://supabase.test/auth/v1/authorize?provider=google' });
    });

    it('resolves signed_in after the callback and closes the browser', async () => {
      const service = createService();
      const result = startGoogle(service);
      await vi.waitFor(() => expect(Browser.open).toHaveBeenCalled());

      await service.handleCallbackUrl('restyle://auth/callback?flow=google&code=abc');

      expect(await result).toEqual({ ok: true, data: 'signed_in' });
      expect(Browser.close).toHaveBeenCalled();
      expect(removeFinished).toHaveBeenCalled();
    });

    it('resolves cancelled when the browser is closed without callback (FR-017a)', async () => {
      const service = createService();
      const result = startGoogle(service);
      await vi.waitFor(() => expect(browserFinished).toBeDefined());

      browserFinished?.();
      await vi.advanceTimersByTimeAsync(GOOGLE_CANCEL_GRACE_MS);

      expect(await result).toEqual({ ok: true, data: 'cancelled' });
      expect(removeFinished).toHaveBeenCalled();
    });

    it('stays signed_in when browserFinished arrives just before the callback (Android)', async () => {
      const service = createService();
      const result = startGoogle(service);
      await vi.waitFor(() => expect(browserFinished).toBeDefined());

      browserFinished?.();
      const callback = service.handleCallbackUrl('restyle://auth/callback?flow=google&code=abc');
      await vi.advanceTimersByTimeAsync(GOOGLE_CANCEL_GRACE_MS);
      await callback;

      expect(await result).toEqual({ ok: true, data: 'signed_in' });
    });

    it('stays signed_in when closing the browser fires browserFinished (iOS)', async () => {
      vi.mocked(Browser.close).mockImplementation(async () => browserFinished?.());
      const service = createService();
      const result = startGoogle(service);
      await vi.waitFor(() => expect(browserFinished).toBeDefined());

      await service.handleCallbackUrl('restyle://auth/callback?flow=google&code=abc');
      await vi.advanceTimersByTimeAsync(GOOGLE_CANCEL_GRACE_MS);

      expect(await result).toEqual({ ok: true, data: 'signed_in' });
    });

    it('resolves cancelled for an access_denied callback', async () => {
      const service = createService();
      const result = startGoogle(service);
      await vi.waitFor(() => expect(Browser.open).toHaveBeenCalled());

      await service.handleCallbackUrl('restyle://auth/callback?flow=google&error=access_denied');

      expect(await result).toEqual({ ok: true, data: 'cancelled' });
    });

    it('reports oauth_failed when the callback fails', async () => {
      mock.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: null, user: null },
        error: new AuthPKCECodeVerifierMissingError(),
      });
      const service = createService();
      const result = startGoogle(service);
      await vi.waitFor(() => expect(Browser.open).toHaveBeenCalled());

      await service.handleCallbackUrl('restyle://auth/callback?flow=google&code=abc');

      expect(await result).toEqual({ ok: false, error: authError('oauth_failed') });
    });

    it('ignores browserFinished after the callback was handled', async () => {
      const service = createService();
      const result = startGoogle(service);
      await vi.waitFor(() => expect(browserFinished).toBeDefined());

      await service.handleCallbackUrl('restyle://auth/callback?flow=google&code=abc');
      browserFinished?.();

      expect(await result).toEqual({ ok: true, data: 'signed_in' });
    });

    it('reports oauth_failed when supabase cannot build the OAuth URL', async () => {
      mock.auth.signInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: null },
        error: new AuthApiError('Unsupported provider', 400, 'provider_disabled'),
      });
      const service = createService();

      expect(await service.signInWithGoogle()).toEqual({ ok: false, error: authError('oauth_failed') });
      expect(Browser.open).not.toHaveBeenCalled();
    });

    it('reports network when offline', async () => {
      mock.auth.signInWithOAuth.mockRejectedValue(new TypeError('Failed to fetch'));
      const service = createService();

      expect(await service.signInWithGoogle()).toEqual({ ok: false, error: authError('network') });
    });

    it('reports oauth_failed when the browser cannot be opened', async () => {
      vi.mocked(Browser.open).mockRejectedValue(new Error('no browser'));
      const service = createService();

      expect(await service.signInWithGoogle()).toEqual({ ok: false, error: authError('oauth_failed') });
      expect(removeFinished).toHaveBeenCalled();
    });

    it('reuses the running promise for repeated calls', async () => {
      const service = createService();

      const first = service.signInWithGoogle();
      expect(service.signInWithGoogle()).toBe(first);
      await vi.waitFor(() => expect(browserFinished).toBeDefined());
      browserFinished?.();
      await vi.advanceTimersByTimeAsync(GOOGLE_CANCEL_GRACE_MS);
      await first;
      expect(Browser.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('normalizeEmail', () => {
    it('trims and lower-cases', () => {
      expect(normalizeEmail('  Anna@Example.COM ')).toBe('anna@example.com');
    });
  });
});
