import {inject, Injectable, signal} from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import {Preferences} from '@capacitor/preferences';
import {Platform} from '@ionic/angular';
import {Capacitor} from '@capacitor/core'
import {removeBackground} from "@imgly/background-removal";

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  // signal updates HTML automatically if the array changes
  // (variable "photos" is the signal in this case)
  public photos = signal<UserPhoto[]>([]);

  private PHOTO_STORAGE: string = 'photos';

  private platform = inject(Platform);

  public async addNewPhotoToGallery() {
    // getPhoto opens the camera and takes a pic
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 85,
    });

    //remove background from image
    const removedBackgroundImage = await this.removeImageBackground(capturedPhoto)

    // Save picture without background
    const savedImageFile = await this.savePicture(removedBackgroundImage);
    // add new pic to the first index of the array
    this.photos.update((photos) => [savedImageFile, ...photos]);

    // cache images
    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });
  }

  private async savePicture(photo: Photo): Promise<UserPhoto> {
    // converts pic/file into text-format
    const base64Data = await this.base64FromPath(photo.webPath!);

    const fileFormat = photo.format || 'webp';
    const fileName = `${Date.now()}.${fileFormat}`;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    // if this platform is mobile
    if (this.platform.is('hybrid')) {
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
      };
    }
  }

  private async base64FromPath(path: string): Promise<string> {

    const response = await fetch(path);
    // extracts the responst (image) as raw binary data (blob)
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string');
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  public async loadSaved(){

    const {value: photoList} = await Preferences.get({key: this.PHOTO_STORAGE});
    const photos = (photoList ? JSON.parse(photoList) : []) as UserPhoto[];

    //if running on desktop
    if(!this.platform.is('hybrid')){
      for (const photo of photos){
        try{
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });

        const extension = photo.filepath.split('.').pop()?.toLowerCase() || 'webp';
        photo.webviewPath = `data:image/${extension};base64,${file.data}`;
        } catch (error) {
          console.warn('Filepath not found: ', error);
        }
      }
    }
    this.photos.set(photos);
  }

  public async removeImageBackground (photo: Photo): Promise<Photo> {
    try{
      const pngBlob = await removeBackground(photo.webPath!);
      const webpBlob = await this.convertBlobToWebp(pngBlob);
      return this.blobToPhoto(webpBlob);
    } catch (error) {
      console.error("Error removing background or converting to webp: ", error);
      throw error;
    }
  }

  private blobToPhoto(blob: Blob): Photo{
    // blob.type could look like this: 'image/webp' and we want to get the format only
    const format = blob.type.split('/')[1] || 'webp';
    return {
      webPath: URL.createObjectURL(blob),
      format: format,
      saved: false,
    }
  }

  // compressing images to a smaller size for the backend
  private async convertBlobToWebp(blob: Blob, quality = 0.6): Promise<Blob> {
    // so we can get the width and height of the blob
    const imageBitmap = await createImageBitmap(blob);

    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // draws the image from the most top left pixel;
    // Without it, the image/canvas would be empty and we can't convert to webp
    ctx.drawImage(imageBitmap, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob) {
            resolve(webpBlob);
          } else {
            // Falls die WebView/der Browser kein Webp-Encoding unterstützt:
            reject(new Error('Webp encoding failed or not supported by browser/webview'));
          }
        },
        'image/webp',
        quality
      );
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
