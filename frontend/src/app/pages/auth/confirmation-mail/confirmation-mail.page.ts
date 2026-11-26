import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonRouterLink } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { RouterLink } from '@angular/router';
import { AppButtonComponent } from '../../../components/app-button/app-button.component';

@Component({
  selector: 'app-confirmation-mail',
  templateUrl: './confirmation-mail.page.html',
  styleUrls: ['./confirmation-mail.page.scss'],
  imports: [RouterLink, AppHeaderComponent, IonContent, CommonModule, FormsModule, IonRouterLink, AppButtonComponent],
})
export class ConfirmationMailPage {}
