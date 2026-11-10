import { Component, OnInit } from '@angular/core';
import { IonNav } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  imports: [IonNav],
})
export class AppHeaderComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
