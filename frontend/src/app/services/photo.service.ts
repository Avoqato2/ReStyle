import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { removeBackground } from '@imgly/background-removal';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  // Kamera → Hintergrund weg → WebP-Blob
  async captureGarmentImage(): Promise<Blob> {
    const photo = await Camera.takePhoto({ quality: 85 });
    const png = await removeBackground(photo.webPath!);
    return this.convertBlobToWebp(png);
  }

  private async convertBlobToWebp(blob: Blob, quality = 0.6): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.convertToBlob({ type: 'image/webp', quality });
  }
}
