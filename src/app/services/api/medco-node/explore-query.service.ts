/**
 * Copyright 2020-2021 EPFL LDS
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Injectable } from '@angular/core';
import { AppConfig } from '../../../config/app.config';
import {Observable, forkJoin, throwError} from 'rxjs';
import {timeout, map, tap, catchError} from 'rxjs/operators';
import { ApiI2b2Panel } from '../../../models/api-request-models/medco-node/api-i2b2-panel';
import { ConstraintMappingService } from '../../constraint-mapping.service';
import { ApiEndpointService } from '../../api-endpoint.service';
import { GenomicAnnotationsService } from '../genomic-annotations.service';
import { ApiExploreQueryResult } from '../../../models/api-response-models/medco-node/api-explore-query-result';
import { MedcoNetworkService } from '../medco-network.service';
import { ExploreQuery } from '../../../models/query-models/explore-query';
import { CryptoService } from '../../crypto.service';
import { ApiNodeMetadata } from '../../../models/api-response-models/medco-network/api-node-metadata';
import { ApiI2b2Timing } from '../../../models/api-request-models/medco-node/api-i2b2-timing';
import { ApiI2b2SequentialOperator } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import { KeycloakService } from 'keycloak-angular';
import { ExploreQueryResult } from 'src/app/models/query-models/explore-query-result';
import { isCipherFormat } from 'src/app/utilities/is-cipher-format';
import { NavbarService } from '../../navbar.service';
import { MessageHelper } from "../../../utilities/message-helper";

@Injectable()
export class ExploreQueryService {
  /**
   * Query timeout: 10 minutes.
   */
  private static QUERY_TIMEOUT_MS = 1000 * 60 * 10;

  /**
   * Last query selection definition used in query that succeeded to return anything
   */
  private _lastSelectionDefinition: ApiI2b2Panel[]

  /**
   * Last query sequential definition used in query that succeeded to return anything
   */
  private _lastSequentialDefinition: ApiI2b2Panel[]

  /**
   * Last query timing used in query that succeeded to return anything
   */
  private _lastQueryTiming: ApiI2b2Timing

  /**
   * Last timing sequence used in query that succeeded to return anything
   */
  private _lastTimingSequence: ApiI2b2SequentialOperator[]

  /**
   * Last query ID used in query that successed to return anything
   */
   private _lastQueryId: string

  constructor(private config: AppConfig,
    private apiEndpointService: ApiEndpointService,
    private medcoNetworkService: MedcoNetworkService,
    private constraintMappingService: ConstraintMappingService,
    private cryptoService: CryptoService,
    private keycloakService: KeycloakService,
    private navbarService: NavbarService) { }

  //  ------------------- api calls ----------------------

  /**
   * @returns {Observable<number>} the resultId
   * @param queryId
   * @param queryTiming
   * @param userPublicKey
   * @param panels
   * @param node
   * @param sync
   */
  // private exploreQuerySingleNode(queryId: string, panels: ApiI2b2Panel[],
  //   queryTiming: ApiI2b2Timing, node: ApiNodeMetadata, sync: boolean = true): Observable<[ApiNodeMetadata, ApiExploreQueryResult]> {
  //   return this.apiEndpointService.postCall(
  //     'node/explore/query?sync=' + sync,
  //     {
  //       id: queryId,
  //       query: {
  //         queryTiming: queryTiming,
  //         panels: panels
  //       }
  //     },
  //     node.url
  //   ).pipe(map((expQueryResp) => [node, expQueryResp['result']]));
  // }

  public exploreQuerySingleNode(queryId: string, selectionPanels: ApiI2b2Panel[], sequentialPanels: ApiI2b2Panel[],
                                queryTiming: ApiI2b2Timing, queryTimingSequence: ApiI2b2SequentialOperator[], publicKey: string): Observable<ExploreQueryResult> {
    const start = performance.now(); // to measure performance
    const haveRightsForPatientList = !!this.keycloakService.getUserRoles().find((role) => role === 'patient_list');
    return this.apiEndpointService.postCall(
      `projects/${this.config.projectId}/datasource/query`,
      {
        aggregationType: haveRightsForPatientList ? 'per_node' : 'aggregated',
        operation: 'exploreQuery',
        broadcast: true,
        outputDataObjectsNames: haveRightsForPatientList ? ['patientList', 'count'] : ['count', 'patientList'],
        targetPublicKey: publicKey,
        parameters: {
          id: queryId,
          definition: {
            selectionPanels: selectionPanels,
            sequentialPanels: sequentialPanels,
            sequentialOperators: queryTimingSequence
          }
        }
      }
    ).pipe(
        catchError((err) => {
          MessageHelper.alert('error', 'Error while querying the data source.');
          return throwError(err);
        }),
        map((expQueryResp) => {
          if (expQueryResp.results) {
            this.lastQueryId = queryId;
            const exploreResult = new ExploreQueryResult();
            exploreResult.queryId = queryId;
            exploreResult.resultInstanceID = [1];

            if (!haveRightsForPatientList) {
              // global count mode
              if (expQueryResp.results.count) {
                const count = expQueryResp.results.count;
                exploreResult.globalCount = count // If the result is in cleartext we use it as is
                if (count.type === 'ciphertable') {
                    const valueInUint8 = this.cryptoService.decodeBase64Url(count.value) as Uint8Array;
                    const decryptedValue = this.cryptoService.decryptCipherTable(valueInUint8);
                    if (isCipherFormat(decryptedValue)) {
                      exploreResult.globalCount = Math.round(decryptedValue.data[0][0]);
                    } else {
                      MessageHelper.alert('error', 'Error decrypting the result.');
                    }
                }
              }
            }

            if (!expQueryResp.results.count) {
              // patient list mode
              const patientListResult = expQueryResp.results.patientList?.data?.[0] || Object.values(expQueryResp.results).reduce(
                (result, orgResult: any) => {
                  if (orgResult.patientList.type === 'ciphertable') {
                    const valueInUint8 = this.cryptoService.decodeBase64Url(orgResult.patientList.value) as Uint8Array;
                    const decryptedValue = this.cryptoService.decryptCipherTable(valueInUint8);
                    if (isCipherFormat(decryptedValue)) {
                      const roundedValues = decryptedValue.data[0].map((value) => Math.round(value));
                      console.log('Query completed in', Math.round(performance.now() - start) + 'ms')
                      return [[ ...result[0], ...roundedValues ]];
                    } else {
                      MessageHelper.alert('error', 'Error decrypting the result.');
                    }
                  } else {
                    console.log('Query completed in', Math.round(performance.now() - start) + 'ms')
                    return [[ ...result[0], ...orgResult.patientList.data[0] ]];
                  }
                },
                [[]]) as number[][];
                exploreResult.patientLists = patientListResult;
                exploreResult.nodes = this.medcoNetworkService.nodes;
                if (haveRightsForPatientList) {
                  exploreResult.perSiteCounts = Object.values(expQueryResp.results).reduce(
                    (result: number[], orgResult: any) => {
                      if (orgResult.patientList.type === 'ciphertable') {
                        const valueInUint8 = this.cryptoService.decodeBase64Url(orgResult.patientList.value) as Uint8Array;
                        const decryptedValue = this.cryptoService.decryptCipherTable(valueInUint8);
                        if (isCipherFormat(decryptedValue)) {
                          console.log('Query completed in', Math.round(performance.now() - start) + 'ms')
                          return [ ...result, decryptedValue.data[0].length ];
                        } else {
                          MessageHelper.alert('error', 'Error decrypting the result.');
                        }
                      } else {
                        console.log('Query completed in', Math.round(performance.now() - start) + 'ms')
                        return [ ...result, orgResult.patientList.data[0].length ];
                      }
                    },
                    []) as number[];
                    exploreResult.globalCount = exploreResult.perSiteCounts.reduce((a, b) => a + b, 0);
              }
            }
            if (exploreResult.globalCount === 0) {
              MessageHelper.alert('info', '0 subjects found for this query.');
              this.navbarService.navigateToExploreTab();
            }
            console.log('Query completed in', Math.round(performance.now() - start) + 'ms')
            return exploreResult;
          } else {
            MessageHelper.alert('error', 'Error while querying datasource.', expQueryResp.error);
            return throwError(expQueryResp.error);
          }
      })
    ) as Observable<ExploreQueryResult>;
  }

  public getDataobjectData(dataObjectSharedId: string): Observable<any> {
    return this.apiEndpointService.getCall(`shared-dataobjects/${dataObjectSharedId}/data`, {
      headers: {
        Accept: '*/*'
      }
    }).pipe(map((sharedDataObjectData) => sharedDataObjectData));
  }

  // -------------------------------------- helper calls --------------------------------------

  /**
   * Execute simultaneously the specified MedCo query on all the nodes.
   * Ensures before execute that the token is still valid.
   *
   * @param queryId
   * @param queryTiming
   * @param userPublicKey
   * @param panels
   */
  private exploreQueryLocalNode(queryId: string, userPublicKey: string,
    selectionPanels: ApiI2b2Panel[], sequentialPanels: ApiI2b2Panel[], queryTiming: ApiI2b2Timing, queryTimingSequence: ApiI2b2SequentialOperator[]) {

    return this.exploreQuerySingleNode(queryId, selectionPanels, sequentialPanels, queryTiming, queryTimingSequence,  userPublicKey)
      .pipe(timeout(ExploreQueryService.QUERY_TIMEOUT_MS));
  }

    /**
   * Execute simultaneously the specified MedCo query on all the nodes.
   * Ensures before execute that the token is still valid.
   *
   * @param queryId
   * @param queryTiming
   * @param userPublicKey
   * @param panels
   */
     private exploreQueryAllNodes(queryId: string, userPublicKey: string,
                                  selectionPanels: ApiI2b2Panel[],
                                  sequentialPanels: ApiI2b2Panel[],
                                  queryTiming: ApiI2b2Timing,
                                  queryTimingSequence: ApiI2b2SequentialOperator[]) {

      return this.exploreQuerySingleNode(queryId, selectionPanels, sequentialPanels, queryTiming, queryTimingSequence, userPublicKey)
        .pipe(timeout(ExploreQueryService.QUERY_TIMEOUT_MS));
    }

  /**
   *
   * @param query
   */
  exploreLocalQuery(query: ExploreQuery) {
    let currentSelectionDefinition = this.constraintMappingService.mapConstraint(query.constraint, query.queryTimingSameInstanceNum);
    let currentSequentialDefinition = this.constraintMappingService.mapConstraint(query.sequentialConstraint, query.queryTimingSameInstanceNum)
    let currentTiming = query.queryTimingSameInstanceNum ? ApiI2b2Timing.sameInstanceNum : ApiI2b2Timing.any;
    let currentTimingSequence = query.sequentialConstraint.temporalSequence

    return this.exploreQueryLocalNode(
      query.uniqueId,
      this.cryptoService.ephemeralPublicKey,
      currentSelectionDefinition,
      currentSequentialDefinition,
      currentTiming,
      currentTimingSequence
    ).pipe(tap(() => {
      this._lastSelectionDefinition = currentSelectionDefinition
      this._lastSequentialDefinition = currentSequentialDefinition
      this._lastQueryTiming = currentTiming
      this._lastTimingSequence = currentTimingSequence
    }));
  }

  /**
   *
   * @param query
   */
  exploreQuery(query: ExploreQuery) {
    let currentSelectionDefinition = this.constraintMappingService.mapConstraint(query.constraint, query.queryTimingSameInstanceNum);
    let currentSequentialDefinition = this.constraintMappingService.mapConstraint(query.sequentialConstraint, query.queryTimingSameInstanceNum)
    let currentTiming = query.queryTimingSameInstanceNum ? ApiI2b2Timing.sameInstanceNum : ApiI2b2Timing.any;
    let currentTimingSequence = query.sequentialConstraint.temporalSequence;

    return this.exploreQueryAllNodes(
      query.uniqueId,
      this.cryptoService.ephemeralPublicKey,
      currentSelectionDefinition,
      currentSequentialDefinition,
      currentTiming,
      currentTimingSequence,
    ).pipe(tap(() => {
      this._lastSelectionDefinition = currentSelectionDefinition
      this._lastSequentialDefinition = currentSelectionDefinition
      this._lastQueryTiming = currentTiming
      this._lastTimingSequence = currentTimingSequence
    }));
  }

  get lastSelectionDefinition(): ApiI2b2Panel[] {
    return this._lastSelectionDefinition
  }

  get lastSequentialDefinition(): ApiI2b2Panel[] {
    return this._lastSequentialDefinition
  }

  get lastQueryTiming(): ApiI2b2Timing {
    return this._lastQueryTiming
  }

  get lastTimingSequence(): ApiI2b2SequentialOperator[] {
    return this._lastTimingSequence
  }

  get lastQueryId(): string {
    return this._lastQueryId;
  }

  set lastQueryId(value: string) {
    this._lastQueryId = value;
  }
}
