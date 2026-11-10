import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNav } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header/header.component';
import { PasswordChangedPage } from '../password-changed/password-changed.page';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  imports: [RouterLink, IonNav, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, PasswordChangedPage],
})
export class ResetPasswordPage{
  
}
