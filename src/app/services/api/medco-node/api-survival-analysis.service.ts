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
import { MedcoNetworkService } from '../medco-network.service';
import { CryptoService } from '../../crypto.service';
import { Observable, forkJoin } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {ApiSurvivalAnalysisResponse} from '../../../models/api-response-models/survival-analysis/survival-analysis-response';
import {ApiSurvivalAnalysis} from '../../../models/api-request-models/survival-analyis/api-survival-analysis';
import { AppConfig } from 'src/app/config/app.config';

@Injectable()
export class ApiSurvivalAnalysisService {

  /**
  * Query timeout: 10 minutes.
  */
  private static TIMEOUT_MS = 1000 * 60 * 10;

  constructor(private apiEndpointService: ApiEndpointService,
    private medcoNetworkService: MedcoNetworkService,
    private cryptoService: CryptoService,
    private appConfig: AppConfig) { }

  survivalAnalysisSingleNode(apiSurvivalAnalysis: ApiSurvivalAnalysis): Observable<ApiSurvivalAnalysisResponse> {
    return this.apiEndpointService.postCall(
      `projects/${this.appConfig.projectId}/datasource/query`,
      {
        operation: 'survivalQuery',
        aggregationType: 'aggregated',
        broadcast: true,
        outputDataObjectsNames: ['survivalQueryResult'],
        parameters: apiSurvivalAnalysis
      }
    )
  }


  survivalAnalysisAllNodes(apiSurvivalAnalysis: ApiSurvivalAnalysis): Observable<ApiSurvivalAnalysisResponse[]> {
    apiSurvivalAnalysis.userPublicKey = this.cryptoService.ephemeralPublicKey
    return forkJoin(this.medcoNetworkService.nodes.map(
      () => {
        return this.survivalAnalysisSingleNode(apiSurvivalAnalysis)
      }
    ))
      .pipe(timeout(ApiSurvivalAnalysisService.TIMEOUT_MS))
  }
}
