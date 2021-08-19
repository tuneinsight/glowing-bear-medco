/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiI2b2Panel } from './api-i2b2-panel';
import { ApiI2b2Timing } from './api-i2b2-timing';
import { ApiI2b2TimingSequenceInfo } from './api-sequence-of-events/api-i2b2-timing-sequence-info';

export class ApiQueryDefinition {
  panels: ApiI2b2Panel[];
  queryTiming: ApiI2b2Timing;
  queryTimingSequence: ApiI2b2TimingSequenceInfo[];
}
