/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiI2b2Panel } from './api-i2b2-panel';
import { ApiI2b2Timing } from './api-i2b2-timing';
import {ApiI2b2SequentialOperator} from './api-sequence-of-events/api-i2b2-sequential-operator';

export class ApiQueryDefinition {
  selectionPanels: ApiI2b2Panel[];
  // queryTiming is not sent to the backend, always "any" is sent.
  // this variable is only used to decide whether to send the panel timing or not.
  queryTiming: ApiI2b2Timing;
  sequentialPanels: ApiI2b2Panel[];
  sequentialOperators: ApiI2b2SequentialOperator[];
}
