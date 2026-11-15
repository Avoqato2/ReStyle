import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import {defineCustomElements} from '@ionic/pwa-elements/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

defineCustomElements(window);
bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers ?? []),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
    ),
  ],
});
