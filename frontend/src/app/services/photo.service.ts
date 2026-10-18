import {inject, Injectable, signal} from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import {Preferences} from '@capacitor/preferences';
import {Platform} from '@ionic/angular';
import {Capacitor} from '@capacitor/core'

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
      quality: 100,
    });

    // Save captured pic
    const savedImageFile = await this.savePicture(capturedPhoto);
    // add new pic to the first index of the array
    this.photos.update((photos) => [savedImageFile, ...photos]);

    // cache images
    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });
  }

  private async savePicture(photo: Photo) {
    // base64 converts pic (or files) into text-format
    let base64Data: string | Blob;

    if(this.platform.is('hybrid')){
      const file = await Filesystem.readFile({
        path: photo.path!
      });
      base64Data = file.data;
    } else {
      base64Data = await this.base64FromPath(photo.webPath!);
    }

    // Write the file to the data directory
    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data, // internal app-directory for pictures, notes and user-data
    });

    if(this.platform.is('hybrid')){
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
        const file = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
        photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
      }
    }
    this.photos.set(photos);
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}
