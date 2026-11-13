import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabs, IonHeader, IonToolbar, IonTitle, IonContent, IonTab } from "@ionic/angular";

@Component({
  selector: 'app-styling',
  templateUrl: './styling.page.html',
  styleUrls: ['./styling.page.scss'],
  imports: [IonContent, IonTitle, IonToolbar, IonHeader, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class StylingPage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
