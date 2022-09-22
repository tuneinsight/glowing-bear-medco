/**
 * Copyright 2021 CHUV
 * Copyright 2021 EPFL LDS
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable } from '@angular/core';
import {forkJoin, Observable, Subject, throwError} from 'rxjs';
import { of } from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import { ExploreCohortsService } from './api/medco-node/explore-cohorts.service';
import { AuthenticationService } from './authentication.service';
import { CryptoService } from './crypto.service';
import {ApiNodeMetadata} from '../models/api-response-models/medco-network/api-node-metadata';
import {MessageHelper} from '../utilities/message-helper';
import {ApiCohortsPatientLists} from '../models/api-request-models/medco-node/api-cohorts-patient-lists';
import {OperationStatus} from '../models/operation-status';
import {ExploreQueryType} from '../models/query-models/explore-query-type';
import {ErrorHelper} from '../utilities/error-helper';

@Injectable()
export class SavedCohortsPatientListService {

  /*
   * listStorage stores the patient list, indexed by the cohort's name they relate to.
   * There is one list per node.
   */
  _listStorage = new Map<string, [ApiNodeMetadata[], number[][]]>()

  /*
   * statusStorage stores the status of list when API calls were necessary
   */
  _statusStorage = new Map<string, OperationStatus>()

  /*
   * statusSubjectStorage is used to notify changes in patient list status
   */

  _statusSubjectStorage = new Map<string, Subject<OperationStatus>>()

  /*
  * Generates a newID for a query.
  */
  private static generateId(): string {
    let d = new Date();
    let id = `MedCo_Cohorts_Patient_List_${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDate()}${d.getUTCHours()}` +
      `${d.getUTCMinutes()}${d.getUTCSeconds()}${d.getUTCMilliseconds()}`;

    return id
  }

  constructor(private cryptoService: CryptoService,
    private exploreCohortsService: ExploreCohortsService,
    private authenticationService: AuthenticationService) { }

  /**
   * getListStatusNotifier creates or returns existing rxjs Subject, indentified by the cohort name,
   * and returns it as an rxjs Observable.
   * getListStatusNotifier must be used before getList to work correctly.
   *
   * @param cohortName
   */
  getListStatusNotifier(cohortName: string): Observable<OperationStatus> {
    if (this._statusSubjectStorage.has(cohortName)) {
      return this._statusSubjectStorage.get(cohortName).asObservable()
    }
    let sub = new Subject<OperationStatus>()
    this._statusSubjectStorage.set(cohortName, sub)
    return sub.asObservable()
  }


  /**
   * insertPatientList insert new patient lists to its list storage.
   * It may be used when clear patient numbers come from another service/component
   *
   * @param cohortName
   * @param nodes
   * @param patientLists
   */
  insertPatientList(cohortName: string, nodes: ApiNodeMetadata[], patientLists: number[][]) {
    if (this._listStorage.has(cohortName)) {
      throw ErrorHelper.handleNewError(`Cannot insert new patient lists to already existing saved cohort ${cohortName}`)
    }
    this._listStorage.set(cohortName, [nodes, patientLists])
  }

  removePatientList(cohortName: string) {
    if (this._listStorage.has(cohortName)) {
      this._listStorage.delete(cohortName)
    }
  }

  get authorizedForPatientList(): boolean {

    for (const role of this.authenticationService.userRoles) {
      if (role === ExploreQueryType.PATIENT_LIST.id) {
        return true
      }
    }
    return false
  }

  get statusStorage(): Map<string, OperationStatus> {
    return this._statusStorage
  }
}
