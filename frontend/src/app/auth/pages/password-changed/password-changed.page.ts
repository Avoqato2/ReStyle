import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonNav } from '@ionic/angular';
import { AppHeaderComponent } from '../../../components/app-header/app-header.component';
import { HomePage } from '../../../../home/home.page';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-password-changed',
  templateUrl: './password-changed.page.html',
  styleUrls: ['./password-changed.page.scss'],
  imports: [RouterLink, IonNav, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, AppHeaderComponent, HomePage],
})
export class PasswordChangedPage{
  
}
