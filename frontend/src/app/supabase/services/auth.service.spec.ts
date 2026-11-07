import { TestBed } from '@angular/core/testing';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from '../supabase.client';
import { AuthService, normalizeEmail } from './auth.service';

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
  };

  return {
    auth,
    emit: (event: AuthChangeEvent, session: Session | null) => listener?.(event, session),
  };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('AuthService', () => {
  let mock: ReturnType<typeof createAuthMock>;

  function createService(): AuthService {
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: { auth: mock.auth } }],
    });
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

  describe('normalizeEmail', () => {
    it('trims and lower-cases', () => {
      expect(normalizeEmail('  Anna@Example.COM ')).toBe('anna@example.com');
    });
  });
});
