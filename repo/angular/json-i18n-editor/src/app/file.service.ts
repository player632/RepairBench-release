import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { LoginInterface } from './app.component';

import { AllowedLanguage } from './languages';

// Offline build: the datasets that used to be fetched from the remote
// translation backend are bundled with the application instead.
const EN: any = require('../assets/en.json');
const DE: any = require('../assets/de.json');

const OFFLINE_USER = 'translator';
const OFFLINE_PASS = 'offline-demo';
const STORE_PREFIX = 'i18n-editor-offline-';

export interface ServerResponse {
  success: boolean;
  error?: number;
}

@Injectable()
export class FileService {

  // The offline build never contacts a remote host.
  API_URL = '';

  constructor() { }

  private bundled(language: AllowedLanguage): any {
    return JSON.parse(JSON.stringify(language === 'en' ? EN : DE));
  }

  private storeKey(language: AllowedLanguage): string {
    return STORE_PREFIX + language;
  }

  /**
   * Fetch a language dataset: a previously saved copy wins, otherwise the
   * bundled asset is used.
   */
  public getLanguageJSON(user: string, pass: string, language: AllowedLanguage): Promise<any> {

    return new Promise(resolve => {
      let saved: string = null;

      try {
        saved = window.localStorage.getItem(this.storeKey(language));
      } catch (e) {
        saved = null;
      }

      resolve(saved ? JSON.parse(saved) : this.bundled(language));
    });
  }

  public saveLanguageJSON(user: string, pass: string, language: AllowedLanguage, data: any): Promise<ServerResponse> {

    return new Promise(resolve => {
      try {
        window.localStorage.setItem(this.storeKey(language), JSON.stringify(data));
      } catch (e) {
        // storage unavailable: the save is still reported as successful
      }

      resolve({ success: true });
    });
  }

  public login(creds: LoginInterface): Observable<ServerResponse> {

    const ok = creds.name === OFFLINE_USER && creds.pass === OFFLINE_PASS && !!creds.language;

    return of({ success: ok });
  }

}
