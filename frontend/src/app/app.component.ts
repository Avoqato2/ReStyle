import { Component, DestroyRef, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { AuthService } from './supabase/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly auth = inject(AuthService);

  constructor() {
    // Einziger appUrlOpen-Listener der App: Deep Links (restyle://auth/callback…)
    // gehen an den AuthService, der den Link einlöst.
    const listener = App.addListener('appUrlOpen', ({ url }) => {
      void this.auth.handleCallbackUrl(url);
    });

    inject(DestroyRef).onDestroy(() => {
      void listener.then((handle) => handle.remove());
    });
  }
}
