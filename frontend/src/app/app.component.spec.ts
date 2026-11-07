import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from '@capacitor/app';
import { Subject } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService, type AuthCallbackEvent } from './supabase/services/auth.service';

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
});
