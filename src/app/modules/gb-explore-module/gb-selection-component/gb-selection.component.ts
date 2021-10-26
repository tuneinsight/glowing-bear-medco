/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, Input, ViewChild } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import { GbConstraintComponent } from '../constraint-components/gb-constraint/gb-constraint.component';
import { QueryService } from '../../../services/query.service';
import { ConstraintService } from '../../../services/constraint.service';
import { FormatHelper } from '../../../utilities/format-helper';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SelectItem } from 'primeng';
import { CohortService } from '../../../services/cohort.service';
import { ApiI2b2Timing } from '../../../models/api-request-models/medco-node/api-i2b2-timing';
import { CombinationConstraint } from '../../../models/constraint-models/combination-constraint';
import { OperationType } from '../../../models/operation-models/operation-types';
import { QueryTemporalSetting } from 'src/app/models/query-models/query-temporal-setting';
import { ApiI2b2TimingSequenceInfo } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-timing-sequence-info';

type LoadingState = 'loading' | 'complete';

@Component({
  selector: 'gb-selection',
  templateUrl: './gb-selection.component.html',
  styleUrls: ['./gb-selection.component.css'],
  animations: [
    trigger('notifyState', [
      transition('loading => complete', [
        style({
          background: 'rgba(51, 156, 144, 0.5)'
        }),
        animate('1000ms ease-out', style({
          background: 'rgba(255, 255, 255, 0.0)'
        }))
      ])
    ])
  ]
})
export class GbSelectionComponent {

  _timings: SelectItem[] = [
    { label: 'Treat groups independently', value: QueryTemporalSetting.independent },
    { label: 'Selected groups occur in the same instance', value: QueryTemporalSetting.sameinstance },
    { label: 'Selected groups occur in a temporal sequence', value: QueryTemporalSetting.sequential }]

  @ViewChild('rootInclusionConstraintComponent', { static: true }) rootInclusionConstraintComponent: GbConstraintComponent;
  @ViewChild('rootExclusionConstraintComponent', { static: true }) rootExclusionConstraintComponent: GbConstraintComponent;

  private isUploadListenerNotAdded: boolean;

  constructor(private constraintService: ConstraintService,
    private queryService: QueryService,
    private cohortService: CohortService) {
    this.isUploadListenerNotAdded = true;
    // changes coming from cohort restoration
    combineLatest([this.cohortService.queryTiming, this.cohortService.queryTemporalSequence])
      .subscribe(([timing, sequenceInfo]: [ApiI2b2Timing, ApiI2b2TimingSequenceInfo[]]) => {
        if ((sequenceInfo === null) || (sequenceInfo.length === 0)) {
          this.queryService.queryTiming = timing === ApiI2b2Timing.sameInstanceNum ?
            QueryTemporalSetting.sameinstance :
            QueryTemporalSetting.independent
        } else{
          this.queryService.queryTiming = QueryTemporalSetting.sequential
          this.queryService.sequentialInfo = sequenceInfo
        }
      })
  }

  @Input()
  set operationType(opType: OperationType) {
    this.queryService.operationType = opType
  }

  get operationType(): OperationType {
    return this.queryService.operationType
  }

  get timings(): SelectItem[] {
    return this._timings
  }

  set queryTiming(val: QueryTemporalSetting) {
    this.queryService.queryTiming = val
  }

  get queryTiming(): QueryTemporalSetting {
    return this.queryService.queryTiming
  }

  get globalCount(): Observable<string> {
    return this.queryService.queryResults.pipe(map((queryResults) =>
      queryResults ? FormatHelper.formatCountNumber(queryResults.globalCount) : '0'
    ));
  }

  get loadingState(): LoadingState {
    return this.queryService.isUpdating ? 'loading' : 'complete';
  }

  get rootInclusionConstraint(): CombinationConstraint {
    return this.constraintService.rootInclusionConstraint
  }

  get rootExclusionConstraint(): CombinationConstraint {
    return this.constraintService.rootExclusionConstraint
  }

}
