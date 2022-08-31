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
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ExploreStatisticsService } from 'src/app/services/explore-statistics.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';
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

  execQuery(event) {
    event.stopPropagation();


    if (this.config.getConfig('isBiorefMode')) {
      this.execExploreStatisticsQuery(event);
    }


    this.queryService.execQuery();
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

  get isBiorefMode(): boolean {
    return this.config.getConfig('isBiorefMode');
  }

  get isGlobalCountOrPatientList(): boolean {
    return this.keycloakService.isUserInRole('global_count') ||
            this.keycloakService.isUserInRole('patient_list');
  }


}
