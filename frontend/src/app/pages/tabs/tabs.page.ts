import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabButton, IonIcon, IonLabel, IonTabs, IonTabBar } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabBar, IonTabs, IonLabel, IonIcon, IonTabButton, CommonModule, FormsModule],
})
export class TabsPage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
