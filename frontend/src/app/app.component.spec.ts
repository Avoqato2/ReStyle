import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from '@capacitor/app';
import { Subject } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService, type AuthCallbackEvent } from './supabase/services/auth/auth.service';

vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn() },
}));

type UrlOpenListener = (event: { url: string }) => void;

describe('AppComponent', () => {
  let urlOpenListener: UrlOpenListener | undefined;
  let removeListener: ReturnType<typeof vi.fn>;
  let authService: { handleCallbackUrl: ReturnType<typeof vi.fn>; callbackEvents: Subject<AuthCallbackEvent> };

  beforeEach(async () => {
    removeListener = vi.fn().mockResolvedValue(undefined);
    vi.mocked(App.addListener).mockImplementation(((_event: string, listener: UrlOpenListener) => {
      urlOpenListener = listener;
      return Promise.resolve({ remove: removeListener });
    }) as unknown as typeof App.addListener);

    authService = {
      handleCallbackUrl: vi.fn().mockResolvedValue({ type: 'email_confirmed' }),
      callbackEvents: new Subject<AuthCallbackEvent>(),
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.mocked(App.addListener).mockReset();
    urlOpenListener = undefined;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('registers exactly one appUrlOpen listener', () => {
    TestBed.createComponent(AppComponent);

    expect(App.addListener).toHaveBeenCalledTimes(1);
    expect(App.addListener).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
  });

  it('passes opened URLs to AuthService.handleCallbackUrl', () => {
    TestBed.createComponent(AppComponent);

    urlOpenListener?.({ url: 'restyle://auth/callback?flow=signup&code=abc' });

    expect(authService.handleCallbackUrl).toHaveBeenCalledWith('restyle://auth/callback?flow=signup&code=abc');
  });

  it('removes the listener on destroy', async () => {
    const fixture = TestBed.createComponent(AppComponent);

    fixture.destroy();
    await Promise.resolve();

    expect(removeListener).toHaveBeenCalled();
  });

  describe('navigation after callback events', () => {
    const oauthError = { code: 'oauth_failed', message: 'Google fehlgeschlagen' } as const;

    it.each<[AuthCallbackEvent, string, object | undefined]>([
      [{ type: 'email_confirmed' }, '/home', undefined],
      [{ type: 'email_confirmed_login_required' }, '/login?hint=confirmed', undefined],
      [{ type: 'password_recovery' }, '/reset-password', { state: { passwordRecovery: true } }],
      [{ type: 'oauth_signed_in' }, '/home', undefined],
      [{ type: 'oauth_cancelled' }, '/login', undefined],
      [{ type: 'oauth_failed', error: oauthError }, '/login', { state: { authError: oauthError } }],
      [{ type: 'link_invalid', flow: 'signup' }, '/login?hint=link_invalid', undefined],
      [{ type: 'link_invalid', flow: 'recovery' }, '/forgot-password?hint=link_invalid', undefined],
    ])('%o → %s', (event, url, extras) => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      TestBed.createComponent(AppComponent);

      authService.callbackEvents.next(event);

      expect(navigate).toHaveBeenCalledWith(url, extras);
    });

    it('stops navigating after destroy', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      TestBed.createComponent(AppComponent).destroy();

      authService.callbackEvents.next({ type: 'email_confirmed' });

      expect(navigate).not.toHaveBeenCalled();
    });

    it('logs instead of throwing when the target route is missing', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockRejectedValue(new Error('no route'));
      TestBed.createComponent(AppComponent);

      authService.callbackEvents.next({ type: 'email_confirmed' });
      await Promise.resolve();

      expect(error).toHaveBeenCalled();
      error.mockRestore();
    });
  });
});