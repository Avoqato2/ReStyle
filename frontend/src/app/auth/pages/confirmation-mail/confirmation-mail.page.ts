import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonRouterLink } from '@ionic/angular';
import { HeaderComponent } from '../../../components/header/header.component';

@Component({
  selector: 'app-confirmation-mail',
  templateUrl: './confirmation-mail.page.html',
  styleUrls: ['./confirmation-mail.page.scss'],
  imports: [HeaderComponent, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonRouterLink],
})
export class ConfirmationMailPage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
