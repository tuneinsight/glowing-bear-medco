/**
 * Copyright 2020-2021 EPFL LDS
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { v4 as uuidv4 } from 'uuid';
import {Injectable} from '@angular/core';
import {AppConfig} from '../../../config/app.config';
import {Observable, forkJoin, throwError} from 'rxjs';
import {timeout, map, tap, exhaust, catchError} from 'rxjs/operators';
import {ApiI2b2Panel} from '../../../models/api-request-models/medco-node/api-i2b2-panel';
import {ConstraintMappingService} from '../../constraint-mapping.service';
import {ApiEndpointService} from '../../api-endpoint.service';
import {GenomicAnnotationsService} from '../genomic-annotations.service';
import {MedcoNetworkService} from '../medco-network.service';
import {ExploreQuery} from '../../../models/query-models/explore-query';
import {CryptoService} from '../../crypto.service';
import {ApiNodeMetadata} from '../../../models/api-response-models/medco-network/api-node-metadata';
import {ApiI2b2Timing} from '../../../models/api-request-models/medco-node/api-i2b2-timing';
import { KeycloakService } from 'keycloak-angular';
import { ExploreQueryResult } from 'src/app/models/query-models/explore-query-result';
import { MessageHelper } from 'src/app/utilities/message-helper';

@Injectable()
export class ExploreQueryService {
  /**
   * Query timeout: 10 minutes.
   */
  private static QUERY_TIMEOUT_MS = 1000 * 60 * 10;

  /**
   * Last query definition used in query that successed to return anything
   */
  private _lastDefinition: ApiI2b2Panel[]

  /**
   * Last query timing used in query that successed to return anything
   */
  private _lastQueryTiming: ApiI2b2Timing

  /**
   * Last query ID used in query that successed to return anything
   */
   private _lastQueryId: string

  constructor(private config: AppConfig,
    private apiEndpointService: ApiEndpointService,
    private medcoNetworkService: MedcoNetworkService,
    private genomicAnnotationsService: GenomicAnnotationsService,
    private constraintMappingService: ConstraintMappingService,
    private cryptoService: CryptoService,
    private keycloakService: KeycloakService) { }

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

  public exploreQuerySingleNode(queryId: string, panels: ApiI2b2Panel[]): Observable<ExploreQueryResult> {
    const haveRightsForPatientList = !!this.keycloakService.getUserRoles().find((role) => role === 'patient_list');

    return this.apiEndpointService.postCall(
      `projects/${this.config.projectId}/datasource/query`,
      {
        aggregationType: haveRightsForPatientList ? 'per_node' : 'aggregated',
        operation: 'exploreQuery',
        broadcast: true,
        outputDataObjectsNames: haveRightsForPatientList ? ['patientList', 'count'] : ['count', 'patientList'],
        parameters: {
          id: queryId,
          definition: {
            panels: panels
          }
        }
      }
    ).pipe(
        catchError((err) => {
          MessageHelper.alert('error', 'Error while querying datasource.');
          return throwError(err);
        }),
        map(async (expQueryResp) => {
          if (expQueryResp.results) {
            this.lastQueryId = queryId;
            const exploreResult = new ExploreQueryResult();
            exploreResult.queryId = queryId;
            exploreResult.resultInstanceID = [1];
            const globalCountResponse = expQueryResp.results.count?.data?.[0]?.[0] ||
             Object.values(expQueryResp.results).reduce(
              (result, orgResult: any) => {
                return result + orgResult.count.data[0][0];
                },
              0) as number;
            exploreResult.globalCount = globalCountResponse;

            if (Object.values(expQueryResp.results).length > 1) {
              const patientListResult = expQueryResp.results.patientList?.data?.[0] || Object.values(expQueryResp.results).reduce(
                (result, orgResult: any) => {
                  return [[ ...result[0], ...orgResult.patientList.data[0]]];
                },
                [[]]) as number[][];
                exploreResult.patientLists = patientListResult;
                exploreResult.nodes = this.medcoNetworkService.nodes;
                if (haveRightsForPatientList) {
                  exploreResult.perSiteCounts = Object.values(expQueryResp.results).reduce(
                    (result: number[], orgResult: any) => {
                      return [ ...result, orgResult.patientList.data[0].length];
                    },
                    []) as number[];
              }
            }
            if (exploreResult.globalCount === 0) {
              MessageHelper.alert('info', '0 subjects found for this query.');
            }
            return exploreResult;
          } else {
            MessageHelper.alert('error', 'Error while querying datasource.', expQueryResp.error);
            return throwError(expQueryResp.error);
          }
      }),
      exhaust()
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
    panels: ApiI2b2Panel[], queryTiming: ApiI2b2Timing) {

    this.preparePanelTimings(panels, queryTiming)

    return forkJoin([
      this.exploreQuerySingleNode(queryId, panels)
    ]).pipe(timeout(ExploreQueryService.QUERY_TIMEOUT_MS));
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
      panels: ApiI2b2Panel[], queryTiming: ApiI2b2Timing) {

      this.preparePanelTimings(panels, queryTiming)

      return forkJoin(this.medcoNetworkService.nodes.map(
        (node) => this.exploreQuerySingleNode(queryId, /* userPublicKey,*/ panels)
      )).pipe(timeout(ExploreQueryService.QUERY_TIMEOUT_MS));
    }

  /**
   *
   * @param query
   */
  exploreLocalQuery(query: ExploreQuery) {
    let currentDefinition = this.constraintMappingService.mapConstraint(query.constraint);
    let currentTiming = query.queryTimingSameInstanceNum ? ApiI2b2Timing.sameInstanceNum : ApiI2b2Timing.any;

    return this.exploreQueryLocalNode(
      query.uniqueId,
      this.cryptoService.ephemeralPublicKey,
      currentDefinition,
      currentTiming,
    ).pipe(tap(() => {
      this._lastDefinition = currentDefinition
      this._lastQueryTiming = currentTiming
    }));
  }

  /**
   *
   * @param query
   */
  exploreQuery(query: ExploreQuery) {
    let currentDefinition = this.constraintMappingService.mapConstraint(query.constraint);
    let currentTiming = query.queryTimingSameInstanceNum ? ApiI2b2Timing.sameInstanceNum : ApiI2b2Timing.any;

    return this.exploreQueryAllNodes(
      query.uniqueId,
      this.cryptoService.ephemeralPublicKey,
      currentDefinition,
      currentTiming,
    ).pipe(tap(() => {
      this._lastDefinition = currentDefinition
      this._lastQueryTiming = currentTiming
    }));
  }

  // preparePanelTimings reset all panel timing to false if the query-level is false,
  // does nothing otherwise
  private preparePanelTimings(panels: ApiI2b2Panel[], queryTiming: ApiI2b2Timing): void {
    if (queryTiming === ApiI2b2Timing.any) {
      panels.forEach(panel => {
        panel.panelTiming = ApiI2b2Timing.any
      })
    }
  }

  get lastDefinition(): ApiI2b2Panel[] {
    return this._lastDefinition
  }

  get lastQueryTiming(): ApiI2b2Timing {
    return this._lastQueryTiming
  }

  get lastQueryId(): string {
    return this._lastQueryId;
  }

  set lastQueryId(value: string) {
    this._lastQueryId = value;
  }
}
