/**
 * Copyright 2020 CHUV
 * Copyright 2021 EPFL LDS
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable } from '@angular/core';
import { ApiEndpointService } from '../../api-endpoint.service';
import { CryptoService } from '../../crypto.service';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import {ApiSurvivalAnalysisResponse} from '../../../models/api-response-models/survival-analysis/survival-analysis-response';
import {ApiSurvivalAnalysis} from '../../../models/api-request-models/survival-analyis/api-survival-analysis';
import { AppConfig } from 'src/app/config/app.config';
import { isCipherFormat } from 'src/app/utilities/is-cipher-format';
import { MessageHelper } from 'src/app/utilities/message-helper';

@Injectable()
export class ApiSurvivalAnalysisService {

  /**
  * Query timeout: 10 minutes.
  */
  private static TIMEOUT_MS = 1000 * 60 * 10;

  constructor(private apiEndpointService: ApiEndpointService,
    private cryptoService: CryptoService,
    private appConfig: AppConfig) { }

  survivalAnalysisSingleNode(apiSurvivalAnalysis: ApiSurvivalAnalysis): Observable<ApiSurvivalAnalysisResponse> {
    const publicKey = this.cryptoService.ephemeralPublicKey;

    return this.apiEndpointService.postCall(
      `projects/${this.appConfig.projectId}/datasource/query`,
      {
        operation: 'survivalQuery',
        aggregationType: 'aggregated',
        broadcast: true,
        outputDataObjectsNames: ['survivalQueryResult'],
        parameters: apiSurvivalAnalysis,
        targetPublicKey: publicKey
      }
    ).pipe(map((response: ApiSurvivalAnalysisResponse) => {
      if (response.results.survivalQueryResult.type === 'ciphertable') {
        const valueInUint8 = this.cryptoService.decodeBase64Url(response.results.survivalQueryResult.value) as Uint8Array;
        const decryptedValue = this.cryptoService.decryptCipherTable(valueInUint8);
        if (isCipherFormat(decryptedValue)) {
          response.results.survivalQueryResult.data = decryptedValue.data;
        } else {
          MessageHelper.alert('error', 'Error decrypting the result.');
        }
      }
      response.results.survivalQueryResult.data[0] = response.results.survivalQueryResult.data[0].map((value) => Math.round(value));
      return response;
    }))
  }


  survivalAnalysisAllNodes(apiSurvivalAnalysis: ApiSurvivalAnalysis) {
    return this.survivalAnalysisSingleNode(apiSurvivalAnalysis)
      .pipe(timeout(ApiSurvivalAnalysisService.TIMEOUT_MS));
  }
}
