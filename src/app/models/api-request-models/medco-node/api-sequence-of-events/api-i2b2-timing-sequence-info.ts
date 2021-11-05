/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ApiI2b2SequentialOperator } from './api-i2b2-sequential-operator';
import { ApiI2b2TimingSequenceSpan } from './api-i2b2-span/api-i2b2-timing-sequence-span';
import { ApiI2b2WhichDate } from './api-i2b2-which-date';
import { ApiI2b2WhichObservation } from './api-i2b2-which-observation';

export class ApiI2b2TimingSequenceInfo {
  whichDateFirst: ApiI2b2WhichDate;
  whichObservationFirst: ApiI2b2WhichObservation;
  when: ApiI2b2SequentialOperator;
  whichDateSecond: ApiI2b2WhichDate;
  whichObservationSecond: ApiI2b2WhichObservation;
  spans: ApiI2b2TimingSequenceSpan[];

  constructor() {
    this.whichDateFirst = ApiI2b2WhichDate.startdate;
    this.whichObservationFirst = ApiI2b2WhichObservation.first;
    this.when = ApiI2b2SequentialOperator.less;
    this.whichDateSecond = ApiI2b2WhichDate.startdate;
    this.whichObservationSecond = ApiI2b2WhichObservation.first;
  }

  get textRepresentation(): string {
    return `temporal sequence: (which date first: ${this.whichDateFirst}; which observation first: ${this.whichObservationFirst}; when: ${this.when}; which date second: ${this.whichDateSecond}; which observation second: ${this.whichObservationSecond})`;
  }

  clone(): ApiI2b2TimingSequenceInfo {
    let val = new ApiI2b2TimingSequenceInfo()
    val.whichDateFirst = this.whichDateFirst
    val.whichObservationFirst = this.whichObservationFirst
    val.when = this.when
    val.whichDateSecond = this.whichDateSecond
    val.whichObservationSecond = this.whichObservationSecond
    val.spans = ((this.spans) && this.spans.length > 0) ? this.spans.map(span => {
      let newSpan = new ApiI2b2TimingSequenceSpan()
      newSpan.operator = span.operator
      newSpan.units = span.units
      newSpan.value = span.value
      return newSpan
    }) : null
    return val
  }
}
