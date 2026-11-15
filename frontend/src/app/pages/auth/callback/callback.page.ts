import { Component, OnInit, inject } from '@angular/core';
import { IonContent, IonSpinner } from '@ionic/angular';

import { AuthService } from '../../../supabase/services/auth/auth.service';

// Nur Web-Build: Mail- und Google-Links landen im Browser auf `/auth/callback?flow=…`.
// Die Seite reicht die URL an den AuthService weiter; die Navigation danach
// übernimmt AppComponent über `callbackEvents` (T048).
@Component({
  selector: 'app-callback',
  template: `
    <ion-content class="ion-padding">
      <div class="callback">
        <ion-spinner name="crescent" aria-label="Anmeldung wird abgeschlossen"></ion-spinner>
      </div>
    </ion-content>
  `,
  styles: `
    .callback {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  `,
  imports: [IonContent, IonSpinner],
})
export class CallbackPage implements OnInit {
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    void this.auth.handleCallbackUrl(window.location.href);
  }
}
