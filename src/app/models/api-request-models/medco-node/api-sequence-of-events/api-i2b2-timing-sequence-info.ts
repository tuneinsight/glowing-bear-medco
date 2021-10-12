/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ApiI2b2SequentialOperator } from './api-i2b2-sequential-operator';
import { ApiI2b2WhichDate } from './api-i2b2-which-date';
import { ApiI2b2WhichObservation } from './api-i2b2-which-observation';

export class ApiI2b2TimingSequenceInfo {
    WhichDateFirst: ApiI2b2WhichDate;
    WhichObservationFirst: ApiI2b2WhichObservation;
    When: ApiI2b2SequentialOperator;
    WhichDateSecond: ApiI2b2WhichDate;
    WhichObservationSecond: ApiI2b2WhichObservation;

    constructor() {
        this.WhichDateFirst = ApiI2b2WhichDate.startdate;
        this.WhichObservationFirst = ApiI2b2WhichObservation.first;
        this.When = ApiI2b2SequentialOperator.less;
        this.WhichDateSecond = ApiI2b2WhichDate.startdate;
        this.WhichObservationSecond = ApiI2b2WhichObservation.first;
    }

    get textRepresentation(): string {
        return `temporal sequence: (which date first: ${this.WhichDateFirst}; which observation first: ${this.WhichObservationFirst}; when: ${this.When}; which date second: ${this.WhichDateSecond}; which observation second: ${this.WhichObservationSecond})`;
    }

    clone(): ApiI2b2TimingSequenceInfo {
        let val = new ApiI2b2TimingSequenceInfo()
        val.WhichDateFirst = this.WhichDateFirst
        val.WhichObservationFirst = this.WhichObservationFirst
        val.When = this.When
        val.WhichDateSecond = this.WhichDateSecond
        val.WhichObservationSecond= this.WhichObservationSecond
        return val
    }
}
