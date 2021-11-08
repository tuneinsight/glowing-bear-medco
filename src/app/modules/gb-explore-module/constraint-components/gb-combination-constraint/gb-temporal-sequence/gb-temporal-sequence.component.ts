/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef, SelectItem } from 'primeng';
import { Subject } from 'rxjs';
import { ApiI2b2SequentialOperator } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import { ApiI2b2SpanOperator } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-span/api-i2b2-span-operator';
import { ApiI2b2SpanUnits } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-span/api-i2b2-span-units';
import { ApiI2b2TimingSequenceSpan } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-span/api-i2b2-timing-sequence-span';
import { ApiI2b2TimingSequenceInfo } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-timing-sequence-info';
import { ApiI2b2WhichDate } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-which-date';
import { ApiI2b2WhichObservation } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-which-observation';


@Component({
  selector: 'gb-temporal-sequence',
  templateUrl: './gb-temporal-sequence.component.html',
  styleUrls: ['./gb-temporal-sequence.component.css']
})
export class GbTemporalSequenceComponent implements OnInit, OnDestroy {

  _sequenceInfoSubject: Subject<ApiI2b2TimingSequenceInfo>
  _whichDate: SelectItem[] = [
    { label: 'Start date', value: ApiI2b2WhichDate.startdate },
    { label: 'End date', value: ApiI2b2WhichDate.enddate }
  ]
  _whichObservation: SelectItem[] = [
    { label: 'the first ever', value: ApiI2b2WhichObservation.first },
    { label: 'any', value: ApiI2b2WhichObservation.any },
    { label: 'the last ever', value: ApiI2b2WhichObservation.last }
  ]

  _when: SelectItem[] = [
    { label: 'before', value: ApiI2b2SequentialOperator.less },
    { label: 'before or same time as', value: ApiI2b2SequentialOperator.lessequal },
    { label: 'same time as', value: ApiI2b2SequentialOperator.equal }
  ]

  _spanOperator: SelectItem[] = [
    { label: '<', value: ApiI2b2SpanOperator.LESS },
    { label: '≤', value: ApiI2b2SpanOperator.LESSEQUAL },
    { label: '=', value: ApiI2b2SpanOperator.EQUAL },
    { label: '≥', value: ApiI2b2SpanOperator.GREATEREQUAL },
    { label: '>', value: ApiI2b2SpanOperator.EQUAL }
  ]

  _spanUnits: SelectItem[] = [
    { label: 'hour(s)', value: ApiI2b2SpanUnits.HOUR },
    { label: 'day(s)', value: ApiI2b2SpanUnits.DAY },
    { label: 'month(s)', value: ApiI2b2SpanUnits.MONTH },
    { label: 'year(s)', value: ApiI2b2SpanUnits.YEAR }
  ]


  _firstSpan: ApiI2b2TimingSequenceSpan
  _secondSpan: ApiI2b2TimingSequenceSpan

  _firstSpanEnabled = false
  _secondSpanEnabled = false

  _whichDateFirst = ApiI2b2WhichDate.startdate
  _whichObservationFirst = ApiI2b2WhichObservation.first
  _sequentialOperator = ApiI2b2SequentialOperator.less
  _whichDateSecond = ApiI2b2WhichDate.startdate
  _whichObservationSecond = ApiI2b2WhichObservation.first


  private notify() {
    let sequenceInfo = new ApiI2b2TimingSequenceInfo()

    sequenceInfo.spans = undefined
    sequenceInfo.when = this.sequentialOperator
    sequenceInfo.whichDateFirst = this.whichDateFirst
    sequenceInfo.whichObservationFirst = this.whichObservationFirst
    sequenceInfo.whichDateSecond = this.whichDateSecond
    sequenceInfo.whichObservationSecond = this.whichObservationSecond

    if ((this.firstSpanEnabled) || (this.secondSpanEnabled)) {

      sequenceInfo.spans = new Array<ApiI2b2TimingSequenceSpan>()
      if (this.firstSpanEnabled) {
        sequenceInfo.spans.push(this.firstSpan)
      }
      if (this.secondSpanEnabled) {
        sequenceInfo.spans.push(this.secondSpan)
      }
    }
    this._sequenceInfoSubject.next(sequenceInfo)
  }

  validate() {
    this.notify()
    this.ref.close()
  }

  constructor(private config: DynamicDialogConfig, private ref: DynamicDialogRef) {
    this.firstSpan = new ApiI2b2TimingSequenceSpan()
    this.firstSpan.value = 0
    this.secondSpan = new ApiI2b2TimingSequenceSpan()
    this.firstSpan.value = 0

    if (!!(config)) {
      let sequenceInfo = config.data.sequenceInfo

      this.whichDateFirst = sequenceInfo.whichDateFirst
      this.whichObservationFirst = sequenceInfo.whichObservationFirst
      this.sequentialOperator = sequenceInfo.when
      this.whichDateSecond = sequenceInfo.whichDateSecond
      this.whichObservationSecond = sequenceInfo.whichObservationSecond

      if ((sequenceInfo.spans) && (sequenceInfo.spans.length > 0)) {
        let spans = sequenceInfo.spans
        this.firstSpan = spans[0]
        this.firstSpanEnabled = true
        if (spans.length === 2) {
          this.secondSpan = spans[1]
          this.secondSpanEnabled = true
        }
        if (spans.length > 2) {
          console.warn('[EXPLORE] in sequential operator, the number of spans given as input from exceed 2. Elements of index (0-based) exceeding 1 will be discarded.')
        }
      }



    }
    this._sequenceInfoSubject = config.data.sequenceInfoSubject


  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }


  get whichDate(): SelectItem[] {
    return this._whichDate
  }

  get whichObservation(): SelectItem[] {
    return this._whichObservation
  }

  get when(): SelectItem[] {
    return this._when
  }

  get spanOperator(): SelectItem[] {
    return this._spanOperator
  }

  get spanUnits(): SelectItem[] {
    return this._spanUnits
  }

  get firstSpan(): ApiI2b2TimingSequenceSpan {
    return this._firstSpan
  }

  set firstSpan(span: ApiI2b2TimingSequenceSpan) {
    this._firstSpan = span
  }

  get secondSpan(): ApiI2b2TimingSequenceSpan {
    return this._secondSpan
  }

  set secondSpan(span: ApiI2b2TimingSequenceSpan) {
    this._secondSpan = span
  }

  set firstSpanEnabled(value: boolean) {
    if (!value) {
      // the second span is available only if the first one is
      this.secondSpanEnabled = value
    }
    this._firstSpanEnabled = value
  }

  get firstSpanEnabled(): boolean {
    return this._firstSpanEnabled
  }

  set secondSpanEnabled(value: boolean) {
    this._secondSpanEnabled = value
  }

  get secondSpanEnabled(): boolean {
    return this._secondSpanEnabled
  }

  get whichDateFirst(): ApiI2b2WhichDate {
    return this._whichDateFirst
  }

  set whichDateFirst(whichDate: ApiI2b2WhichDate) {
    this._whichDateFirst = whichDate
  }

  get whichObservationFirst(): ApiI2b2WhichObservation {
    return this._whichObservationFirst
  }

  set whichObservationFirst(obs: ApiI2b2WhichObservation) {
    this._whichObservationFirst = obs

  }

  set sequentialOperator(sequentialOperator: ApiI2b2SequentialOperator) {
    this._sequentialOperator = sequentialOperator

  }

  get sequentialOperator(): ApiI2b2SequentialOperator {
    return this._sequentialOperator
  }

  set whichDateSecond(whichDate: ApiI2b2WhichDate) {
    this._whichDateSecond = whichDate

  }
  get whichDateSecond(): ApiI2b2WhichDate {
    return this._whichDateSecond
  }

  get whichObservationSecond(): ApiI2b2WhichObservation {
    return this._whichObservationSecond
  }

  set whichObservationSecond(obs: ApiI2b2WhichObservation) {
    this._whichObservationSecond = obs

  }

}
