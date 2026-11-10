import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonRouterLink } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-confirmation-mail',
  templateUrl: './confirmation-mail.page.html',
  styleUrls: ['./confirmation-mail.page.scss'],
  imports: [RouterLink, AppHeaderComponent, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonRouterLink],
})
export class ConfirmationMailPage{
  private readonly router = inject(Router);

  async backToLogin(): Promise<void>{
    await this.router.navigateByUrl('/login');
  }
}
