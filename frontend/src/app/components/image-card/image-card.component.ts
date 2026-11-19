import { Component, OnInit } from '@angular/core';
import { IonImg } from '@ionic/angular';

@Component({
  selector: 'app-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss'],
  imports: [IonImg],
})
export class ImageCardComponent implements OnInit {
  private allImages: string[] = [
    'assets/image-card/ic1.svg',
    'assets/image-card/ic2.svg',
    'assets/image-card/ic3.svg',
    'assets/image-card/ic4.svg',
    'assets/image-card/ic5.svg',
    'assets/image-card/ic6.svg',
    'assets/image-card/ic7.svg',
    'assets/image-card/ic8.svg',
    'assets/image-card/ic9.svg',
    'assets/image-card/ic10.svg',
  ];

  imageCardFile: string = '';

  ngOnInit() {
    this.imageCardFile = this.pickRandomImage();
  }

  pickRandomImage() {
    const randomIndex = Math.floor(Math.random() * this.allImages.length);
    return this.allImages[randomIndex];
  }
}
