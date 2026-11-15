import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-password-changed',
  templateUrl: './password-changed.page.html',
  styleUrls: ['./password-changed.page.scss'],
  imports: [RouterLink, IonContent, CommonModule, FormsModule, AppHeaderComponent],
})
export class PasswordChangedPage {}
