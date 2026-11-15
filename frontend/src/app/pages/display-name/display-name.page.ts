import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-display-name',
  templateUrl: './display-name.page.html',
  styleUrls: ['./display-name.page.scss'],
  imports: [IonContent, CommonModule, FormsModule],
})
export class DisplayNamePage {
  username = '';

  private readonly router = inject(Router);

  async submit(): Promise<void> {
    await this.router.navigateByUrl('/home');
  }
}
