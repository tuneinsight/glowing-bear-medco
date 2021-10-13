/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {Component, Input, OnInit} from '@angular/core';
import {SelectItem} from 'primeng';
import {ApiI2b2SequentialOperator} from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import {ApiI2b2TimingSequenceInfo} from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-timing-sequence-info';
import {ApiI2b2WhichDate} from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-which-date';
import {ApiI2b2WhichObservation} from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-which-observation';


@Component({
  selector: 'gb-temporal-sequence',
  templateUrl: './gb-temporal-sequence.component.html',
  styleUrls: ['./gb-temporal-sequence.component.css']
})
export class GbTemporalSequenceComponent implements OnInit {

  private _sequenceInfo: ApiI2b2TimingSequenceInfo
  private _whichDate: SelectItem[] = [
    { label: 'start date', value: ApiI2b2WhichDate.startdate },
    { label: 'end Date', value: ApiI2b2WhichDate.enddate }
  ]
  private _whichObservation: SelectItem[] = [
    { label: 'first occurence', value: ApiI2b2WhichObservation.first },
    { label: 'any', value: ApiI2b2WhichObservation.any },
    { label: 'last occurence', value: ApiI2b2WhichObservation.last }
  ]

  private _when: SelectItem[] = [
    { label: 'before', value: ApiI2b2SequentialOperator.less },
    { label: 'before or same time', value: ApiI2b2SequentialOperator.lessequal },
    { label: 'same time', value: ApiI2b2SequentialOperator.equal }
  ]

  constructor() { }

  ngOnInit(): void {
  }

  @Input()
  set sequenceInfo(info: ApiI2b2TimingSequenceInfo) {
    this._sequenceInfo = info
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

  get whichDateFirst(): ApiI2b2WhichDate {
    return this._sequenceInfo.WhichDateFirst
  }

  set whichDateFirst(whichDate: ApiI2b2WhichDate) {
    this._sequenceInfo.WhichDateFirst = whichDate
  }

  get whichObsverationFirst(): ApiI2b2WhichObservation {
    return this._sequenceInfo.WhichObservationFirst
  }

  set whichObservationFirst(obs: ApiI2b2WhichObservation) {
    this._sequenceInfo.WhichObservationFirst = obs
  }

  set sequentialOperator(sequentialOperator: ApiI2b2SequentialOperator) {
    this._sequenceInfo.When = sequentialOperator
  }

  get sequentialOperator(): ApiI2b2SequentialOperator {
    return this._sequenceInfo.When
  }

  set whichDateSecond(whichDate: ApiI2b2WhichDate) {
    this._sequenceInfo.WhichDateSecond = whichDate
  }
  get whichDateSecond(): ApiI2b2WhichDate {
    return this._sequenceInfo.WhichDateSecond
  }

  get whichObsverationSecond(): ApiI2b2WhichObservation {
    return this._sequenceInfo.WhichObservationSecond
  }

  set whichObservationSecond(obs: ApiI2b2WhichObservation) {
    this._sequenceInfo.WhichObservationSecond = obs
  }

}
