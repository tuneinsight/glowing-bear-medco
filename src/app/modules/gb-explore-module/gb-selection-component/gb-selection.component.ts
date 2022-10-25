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
import { AppConfig } from 'src/app/config/app.config';
import { QueryTemporalSetting } from 'src/app/models/query-models/query-temporal-setting';
import { ApiI2b2SequentialOperator } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import { SequentialConstraint } from 'src/app/models/constraint-models/sequential-constraint';

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
        animate('500ms ease-out', style({
          background: 'rgba(255, 255, 255, 0.0)'
        }))
      ])
    ])
  ]
})
export class GbSelectionComponent {

  public static readonly timings: SelectItem[] = [
    { label: 'Treat groups independently', value: QueryTemporalSetting.independent },
    { label: 'Selected groups occur in the same instance', value: QueryTemporalSetting.sameinstance },
    { label: 'Selected groups occur in a temporal sequence', value: QueryTemporalSetting.sequential }]

  // to be accessed from the HTML template
  QueryTemporalSetting = QueryTemporalSetting

  @ViewChild('rootConstraintComponent', { static: true }) rootConstraintComponent: GbConstraintComponent;

  constructor(private config: AppConfig,
    private constraintService: ConstraintService,
    private queryService: QueryService,
    private cohortService: CohortService) {
    // changes coming from cohort restoration
    combineLatest([this.cohortService.queryTiming, this.cohortService.queryTemporalSequence])
      .subscribe(([timing, sequenceInfo]: [ApiI2b2Timing, ApiI2b2SequentialOperator[]]) => {
        if ((sequenceInfo === undefined) || (sequenceInfo === null) || (sequenceInfo.length === 0)) {
          this.queryService.queryTiming = timing === ApiI2b2Timing.sameInstanceNum ?
            QueryTemporalSetting.sameinstance :
            QueryTemporalSetting.independent
        } else {
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
    return GbSelectionComponent.timings
  }

  set queryTiming(val: QueryTemporalSetting) {
    this.queryService.queryTiming = val
  }

  get queryTiming(): QueryTemporalSetting {
    return this.queryService.queryTiming
  }

  get rootSelectionConstraint(): CombinationConstraint {
    return this.constraintService.rootSelectionConstraint
  }

  get rootSequentialConstraint(): SequentialConstraint {
    return this.constraintService.rootSequentialConstraint
  }

  get isBiorefMode(): boolean {
    return this.config.getConfig('isBiorefMode');
  }



}
