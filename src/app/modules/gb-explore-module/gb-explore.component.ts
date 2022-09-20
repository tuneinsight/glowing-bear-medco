/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020  LDS EPFL
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { AfterViewChecked, ChangeDetectorRef, Component, Input } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from 'src/app/config/app.config';
import { MedcoNetworkService } from 'src/app/services/api/medco-network.service';
import { ExploreStatisticsService } from 'src/app/services/explore-statistics.service';
import { ErrorHelper } from 'src/app/utilities/error-helper';
import { OperationType } from '../../models/operation-models/operation-types';
import { ExploreQueryType } from '../../models/query-models/explore-query-type';
import { CohortService } from '../../services/cohort.service';
import { ConstraintService } from '../../services/constraint.service';
import { QueryService } from '../../services/query.service';
import { FormatHelper } from '../../utilities/format-helper';

@Component({
  selector: 'gb-explore',
  templateUrl: './gb-explore.component.html',
  styleUrls: ['./gb-explore.component.css']
})
export class GbExploreComponent implements AfterViewChecked {


  OperationType = OperationType


  // Bucket size of each interval of the explore statistics histogram
  @Input() bucketSize: number;
  // Minimal observation that will be taken into account in the construction of the explore statistics histogram
  @Input() minObservation: number;


  constructor(
    private config: AppConfig,
    private queryService: QueryService,
    private cohortService: CohortService,
    public constraintService: ConstraintService,
    private changeDetectorRef: ChangeDetectorRef,
    private exploreStatisticsService: ExploreStatisticsService,
    private medcoNetworkService: MedcoNetworkService,
    private keycloakService: KeycloakService) {
    this.queryService.lastSuccessfulSet.subscribe(resIDs => {
      this.lastSuccessfulSet = resIDs
    })

  }

  // without this, ExpressionChangedAfterItHasBeenCheckedError when going from Analysis to Explore
  ngAfterViewChecked() {
    this.changeDetectorRef.detectChanges()
  }

  execExploreStatisticsQuery(event) {
    event.stopPropagation();

    this.exploreStatisticsService.executeQueryFromExplore(this.bucketSize, this.minObservation)
  }
  async execQuery(event) {
    event.stopPropagation();

    this.queryService.isUpdating = true;

    await this.medcoNetworkService.getNetworkStatus();

    const isOneNodeDown = this.medcoNetworkService.networkStatus.reduce((result, value) => {
      if (result || (this.medcoNetworkService.projectNodes.find((p) => p === value.from) && !value.statuses)) {
        return true;
      }
      return false;
    }, false);

    if (isOneNodeDown) {
      ErrorHelper.handleError('One node became unavailable while preparing the request', new Error());
      this.queryService.isUpdating = false;
      return;
    }


    if (this.config.getConfig('isBiorefMode')) {
      this.execExploreStatisticsQuery(event);
    } else {
      this.queryService.execQuery();
    }
  }



  save() {
    this.cohortService.saveCohortExplore()
  }

  saveIfEnter(event) {
    if (event.keyCode === 13) {
      this.save()
    }
  }
  // otherwise writes data in input filed
  preventDefault(event: Event) {
    event.preventDefault()
  }

  get queryType(): ExploreQueryType {
    return this.queryService.queryType;
  }

  set lastSuccessfulSet(setIDs: number[]) {
    this.cohortService.lastSuccessfulSet = setIDs
  }
  get lastSuccessfulSet(): number[] {
    return this.cohortService.lastSuccessfulSet
  }
  get globalCount(): Observable<string> {
    return this.queryService.queryResults.pipe(map((queryResults) =>
      queryResults ? FormatHelper.formatCountNumber(queryResults.globalCount) : '0'
    ));
  }
  set cohortName(name: string) {
    this.cohortService.cohortName = name
  }
  get cohortName(): string {
    return this.cohortService.cohortName
  }

  get isUpdating(): boolean {
    return this.queryService.isUpdating
  }

  get isDirty(): boolean {
    return this.queryService.isDirty
  }

  get hasConstraint(): boolean {
    return this.constraintService.hasConstraint().valueOf()
  }

  get hasAnalytes(): boolean {
    return this.exploreStatisticsService.hasAnalytes
  }

  get allNodesIsUp(): boolean {
    return this.medcoNetworkService.nodes.every((e) => e.isUp)
  }

  get isBiorefMode(): boolean {
    return this.config.getConfig('isBiorefMode');
  }

  get isGlobalCountOrPatientList(): boolean {
    return this.keycloakService.isUserInRole('global_count') ||
            this.keycloakService.isUserInRole('patient_list');
  }


}
