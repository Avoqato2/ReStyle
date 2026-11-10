import { Component, OnInit } from '@angular/core';
import { IonNav } from '@ionic/angular';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [IonNav],
})
export class AppHeaderComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
