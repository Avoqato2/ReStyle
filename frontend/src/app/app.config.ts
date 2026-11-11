import { NgHcaptchaModule } from 'ng-hcaptcha';
import { environment } from '../environments/environment';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // bestehende Provider
    importProvidersFrom(
      NgHcaptchaModule.forRoot({
        siteKey: environment.hcaptchaSiteKey,
      }),
    ),
  ],
};