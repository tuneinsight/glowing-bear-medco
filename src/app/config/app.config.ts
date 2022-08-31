/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {ErrorHelper} from '../utilities/error-helper';

@Injectable()
export class AppConfig {

  get projectId(): string {
    return this._projectId;
  }

  set projectId(value: string) {
    this._projectId = value;
  }

  get projectName() {
    return this._projectName;
  }

  set projectName(value: string) {
    this._projectName = value;
  }

  static path = 'app/config/';
  private _projectId: string;
  private _projectName: string;
  config: Object = null;
  env: Object = null;

  // see this gist: https://gist.github.com/fernandohu/122e88c3bcd210bbe41c608c36306db9
  constructor(public http: HttpClient) { }

  /**
   * Use to get the data found in the second file (config file)
   * if present; returns default value otherwise.
   */
  public getConfig(key: any, defaultValue: any = null) {
    let value = this.config[key];
    return value != null ? value : defaultValue;
  }

  public setConfig(key: string, value: any = null) {
    this.config[key] = value;
  }

  /**
   * Use to get the data found in the first file (env file)
   */
  public getEnv() {
    return this.env['env'];
  }


  public load(): Promise<void> {
    return new Promise((resolve, reject) => {

      const options = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      };

      this.http.get(AppConfig.path + 'env.json', options)
        .subscribe((envResponse) => {
          this.env = envResponse;

          this.http.get(AppConfig.path + 'config.' + this.getEnv() + '.json')
            .subscribe((responseData) => {
              this.config = responseData;

              console.log('Successfully retrieved config: ', this.config);
              resolve();
            }, (err) => {
              ErrorHelper.handleError(`Error reading ${this.getEnv()} configuration file`, err);
              reject(err);
            });

        }, (err) => {
          ErrorHelper.handleError('Configuration environment could not be read.', err);
          reject(err);
        });
    });
  }
}
