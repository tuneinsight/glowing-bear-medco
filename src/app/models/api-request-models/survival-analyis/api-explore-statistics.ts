/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiI2b2Panel } from '../medco-node/api-i2b2-panel'
import { ApiI2b2Timing } from '../medco-node/api-i2b2-timing'
import {ApiQueryDefinition} from '../medco-node/api-query-definition';

export class ModifierApiObjet {
  modifier: {
    appliedPath: string
    key: string
  }
  queryTerm: string
}

export class ApiExploreStatistics {
  id: string
  userPublicKey: string

  // analytes: modifiers whose distribution will be computed.
  analytes?: Array<ModifierApiObjet>

  bucketSize: number // size of a bucket in the histogram that will be returned to the user.
  minObservations: number /* This limit defines the threshold above which observations for analytes must be.
  * Observations smaller than this threshold will be removed.
  * in the future minObservation will be defined for each analyte.
  * Its value will be set by a phase of exchange of information which will
  * will compute necessary information to define the bucket width used in the construction of
  * the aggregated histogram. We could base ourselves upon interquartile ranges etc...
  */

  /* Similar as the parameter passed to an explore query.
  * The information specified by `cohortDefinition` defines
  * the population upon which the explore statistic is run.
  */
  constraint: ApiQueryDefinition;
  isPanelEmpty: boolean;
}
