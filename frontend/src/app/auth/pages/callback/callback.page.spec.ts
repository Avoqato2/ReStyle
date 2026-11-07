import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../../supabase/services/auth/auth.service';
import { CallbackPage } from './callback.page';

describe('CallbackPage', () => {
  it('passes the current URL to AuthService.handleCallbackUrl', async () => {
    const handleCallbackUrl = vi.fn().mockResolvedValue({ type: 'email_confirmed' });
    await TestBed.configureTestingModule({
      imports: [CallbackPage],
      providers: [{ provide: AuthService, useValue: { handleCallbackUrl } }],
    }).compileComponents();

    TestBed.createComponent(CallbackPage).detectChanges();

    expect(handleCallbackUrl).toHaveBeenCalledWith(window.location.href);
  });
});
