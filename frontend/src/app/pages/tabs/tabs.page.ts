import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabButton, IonIcon, IonLabel, IonTabs, IonTabBar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { accessibility, shirt, home } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabBar, IonTabs, IonLabel, IonIcon, IonTabButton, CommonModule, FormsModule],
})
export class TabsPage {
  constructor() {
    addIcons({ accessibility, shirt, home });
  }
}
