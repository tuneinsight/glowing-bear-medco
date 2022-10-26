/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiI2b2SpanOperator } from './api-i2b2-span-operator';
import { ApiI2b2SpanUnits } from './api-i2b2-span-units';

export class ApiI2b2TimingSequenceSpan {

  operator: ApiI2b2SpanOperator;
  value: number;
  units: ApiI2b2SpanUnits;

  constructor() {
    this.operator = ApiI2b2SpanOperator.LESS;
    this.value = 0;
    this.units = ApiI2b2SpanUnits.DAY;
  }

}
