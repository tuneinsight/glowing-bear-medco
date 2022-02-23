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
import {Observable, forkJoin} from 'rxjs';
import {timeout, map, tap} from 'rxjs/operators';
import {ApiI2b2Panel} from '../../../models/api-request-models/medco-node/api-i2b2-panel';
import {ConstraintMappingService} from '../../constraint-mapping.service';
import {ApiEndpointService} from '../../api-endpoint.service';
import {GenomicAnnotationsService} from '../genomic-annotations.service';
import {ApiExploreQueryResult} from '../../../models/api-response-models/medco-node/api-explore-query-result';
import {MedcoNetworkService} from '../medco-network.service';
import {ExploreQuery} from '../../../models/query-models/explore-query';
import {CryptoService} from '../../crypto.service';
import {ApiNodeMetadata} from '../../../models/api-response-models/medco-network/api-node-metadata';
import {ApiI2b2Timing} from '../../../models/api-request-models/medco-node/api-i2b2-timing';

@Injectable()
export class ExploreQueryService {
  private _dataSourceId: string;
  private _projectId: string;

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

  constructor(private config: AppConfig,
    private apiEndpointService: ApiEndpointService,
    private medcoNetworkService: MedcoNetworkService,
    private genomicAnnotationsService: GenomicAnnotationsService,
    private constraintMappingService: ConstraintMappingService,
    private cryptoService: CryptoService) { }

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
  private exploreQuerySingleNode(queryId: string, userPublicKey: string, panels: ApiI2b2Panel[],
    queryTiming: ApiI2b2Timing, node: ApiNodeMetadata, sync: boolean = true): Observable<[ApiNodeMetadata, ApiExploreQueryResult]> {
    return this.apiEndpointService.postCall(
      'node/explore/query?sync=' + sync,
      {
        id: queryId,
        query: {
          queryTiming: queryTiming,
          userPublicKey: userPublicKey,
          panels: panels
        }
      },
      node.url
    ).pipe(map((expQueryResp) => [node, expQueryResp['result']]));
  }

  public exploreQuerySingleCall(queryId: string, query: ExploreQuery): Observable<[ApiNodeMetadata, ApiExploreQueryResult]> {
    const panels = this.constraintMappingService.mapConstraint(query.constraint);

    const countSharedId = uuidv4();
    const patientSharedId = uuidv4();

    return this.apiEndpointService.postCall(
      `projects/${this.projectId}/datasource/query`,
      {
        aggregationType: "aggregated",
        operation: "exploreQuery",
        parameters: {
          id: queryId,
          definition: {
            panels: panels
          }
        },
        outputDataObjectsSharedIDs: {
          count: countSharedId,
          patientList: patientSharedId
        }
      }
    ).pipe(map((expQueryResp) => {
      expQueryResp.result
      if (expQueryResp.status === "success") {
        this.getDataobjectData(patientSharedId);
      } else {
        console.log('error on querying datasource with', panels);
      }
      console.log('expQueryResp', expQueryResp);
      return undefined;
    }));
  }

  public getDataobjectData(dataObjectSharedId: string) {
    return this.apiEndpointService.getCall(`shared-dataobjects/${dataObjectSharedId}/data`, {
      headers: {
        Accept: '*/*'
      }
    }).subscribe(
        (sharedDataObjectData) => {
        console.log('sharedDataObjectData', sharedDataObjectData);
      return undefined;
    });
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
  private exploreQueryAllNodes(queryId: string, userPublicKey: string,
    panels: ApiI2b2Panel[], queryTiming: ApiI2b2Timing): Observable<[ApiNodeMetadata, ApiExploreQueryResult][]> {

    this.preparePanelTimings(panels, queryTiming)

    return forkJoin(this.medcoNetworkService.nodes.map(
      (node) => this.exploreQuerySingleNode(queryId, userPublicKey, panels, queryTiming, node)
    )).pipe(timeout(ExploreQueryService.QUERY_TIMEOUT_MS));
  }

  /**
   *
   * @param query
   */
  exploreQuery(query: ExploreQuery): Observable<[ApiNodeMetadata, ApiExploreQueryResult][]> {
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

  get dataSourceId(): string {
    return this._dataSourceId;
  }

  set dataSourceId(value: string) {
    this._dataSourceId = value;
  }

  get projectId(): string {
    return this._projectId;
  }

  set projectId(value: string) {
    this._projectId = value;
  }
}
