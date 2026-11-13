import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-garderobe',
  templateUrl: './garderobe.page.html',
  styleUrls: ['./garderobe.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class GarderobePage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
