/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2018 - 2021  EPFL LCA1 / LDS
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Injectable, Injector, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import GeCoCryptoLib, {GeCoCryptoLibLoad} from '@tuneinsight/geco-cryptolib';
import { KeycloakService } from 'keycloak-angular';
import { ApiEndpointService } from './api-endpoint.service';
import { catchError, exhaust, map } from 'rxjs/operators';

@Injectable()
export class CryptoService implements OnDestroy {

  private static nbParallelWorkers = 0;

  private csID: string;

  private publicKey: string;
  private privateKey: string;

  /**
   * This constructor loads an ephemeral pair of keys for this instance of Glowing-Bear.
   */

   private cryptoFunc: GeCoCryptoLib; // Here the exported functions are stored after wasm was initiated
   /*
    WasmSuite is defined like this:
    type MyFunctionInterface = (input: string) => string;

    interface WasmSuite {
        myFunction: MyFunctionInterface;
    }
   */

    // This is just to let components know when WASM is ready
   public ready: BehaviorSubject<boolean> = new BehaviorSubject(false);

   private apiEndpointService: ApiEndpointService;
   private keycloakService: KeycloakService;

   constructor(private injector: Injector) { }

   load() {
    return GeCoCryptoLibLoad('assets/geco-cryptolib.wasm').then(async () => {
      this.keycloakService = this.injector.get(KeycloakService);
      this.apiEndpointService = this.injector.get(ApiEndpointService);
      this.cryptoFunc = globalThis.GeCoCryptoLib;
      await this.apiEndpointService.getCall(
        'params'
      ).pipe(
        catchError((err) => {
          console.error(err);
          alert('Error while getting the crypto params');
          this.keycloakService.logout();
          return throwError(err);
        }),
        map((paramsResponse) => {
          const params = paramsResponse.params;
          const paramsBytes = this.cryptoFunc.decodeBase64Url(params) as Uint8Array;
          const csID = this.cryptoFunc.loadCryptoSystem(paramsBytes);
          if (typeof csID !== 'string') { return; }
          const keyPair = this.cryptoFunc.genKeyPair(csID) as [Uint8Array, Uint8Array];
          const base64PublicKey = this.cryptoFunc.encodeBase64Url(keyPair[1]);

          this.publicKey = base64PublicKey;

          this.csID = csID;
          this.ready.next(true);
        })
      ).toPromise();
    });
  }

  public encryptFloatMatrix(floats: number[][], cols: string[]) {
    return this.cryptoFunc.encryptFloatMatrix(this.csID, floats, cols);
  }

  public decryptCipherTable(encFloats: Uint8Array) {
  return this.cryptoFunc.decryptCipherTable(this.csID, encFloats);
  }

  public decodeBase64Url(data: string) {
    return this.cryptoFunc.decodeBase64Url(data);
  }

  ngOnDestroy() {
  }

  get ephemeralPublicKey() {
    return this.publicKey;
  }
}
