/**
 * Copyright 2020 - 2021 CHUV
 * Copyright 2020 - 2021 EPFL LDS
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@angular/core';
import { MedcoNetworkService } from '../medco-network.service';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {AppConfig} from '../../../config/app.config';
import {ApiCohortResponse} from '../../../models/api-response-models/medco-node/api-cohort-response';
import {ApiEndpointService} from '../../api-endpoint.service';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class ExploreCohortsService {

  /**
   * Query timeout: 10 minutes.
   */
  private static TIMEOUT_MS = 1000 * 60 * 10;

  constructor(private config: AppConfig, private apiEndpointService: ApiEndpointService,
    private medcoNetworkService: MedcoNetworkService,
    private keycloakService: KeycloakService) { }

  getCohortSingleNode(): Observable<ApiCohortResponse> {
    const countSharedId = uuidv4();
    const patientSharedId = uuidv4();

    return this.apiEndpointService.postCall(
      `projects/${this.config.projectId}/datasource/query`,
      {
        aggregationType: 'per_node',
        operation: 'getCohorts',
        parameters: {
          projectID: this.config.projectId,
          limit: 10
        },
        outputDataObjectsSharedIDs: {
          count: countSharedId,
          patientList: patientSharedId
        }
      }
    );
  }

  postCohortSingleNode(cohortName: string, exploreQueryID: string): Observable<string> {
    const haveRightsForPatientList = !!this.keycloakService.getUserRoles().find((role) => role === 'patient_list');

    return this.apiEndpointService.postCall(
      `projects/${this.config.projectId}/datasource/query`,
      {
        aggregationType: 'per_node',
        operation: 'addCohort',
        broadcast: true,
        parameters: {
          name: cohortName,
          projectID: this.config.projectId,
          exploreQueryID: exploreQueryID
        }
      }
    );
  }

  removeCohortSingleNode(name: string, exploreQueryID: string) {
    const haveRightsForPatientList = !!this.keycloakService.getUserRoles().find((role) => role === 'patient_list');

    return this.apiEndpointService.postCall(
      `projects/${this.config.projectId}/datasource/query`,
      {
        aggregationType: 'per_node',
        operation: 'deleteCohort',
        broadcast: true,
        parameters: {
          name,
          exploreQueryID
        }
      }
    );
  }

  getCohortAllNodes(): Observable<ApiCohortResponse> {
    return this.getCohortSingleNode()
      .pipe(timeout(ExploreCohortsService.TIMEOUT_MS))
  }

  postCohortAllNodes(cohortName: string, exploreQueryID: string): Observable<string> {
    return this.postCohortSingleNode(cohortName, exploreQueryID)
      .pipe(timeout(ExploreCohortsService.TIMEOUT_MS))
  }

  removeCohortAllNodes(name: string, exploreQueryId: string) {
    return this.removeCohortSingleNode(name, exploreQueryId)
      .pipe(timeout(ExploreCohortsService.TIMEOUT_MS))
  }
}
