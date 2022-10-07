/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ApiI2b2Panel } from '../medco-node/api-i2b2-panel'
import { ApiI2b2Timing } from '../medco-node/api-i2b2-timing'
import {ApiQueryDefinition} from "../medco-node/api-query-definition";

export class ApiSurvivalAnalysis {
  id: string
  cohortQueryID: string
  subGroupsDefinitions: { name: string, constraint: ApiQueryDefinition }[]
  timeLimit: number
  timeGranularity: string
  startConcept: string
  startsWhen: string
  startModifier?: {
    modifierKey: string
    appliedPath: string
  }
  endConcept: string
  endModifier?: {
    modifierKey: string
    appliedPath: string
  }
  endsWhen: string
  userPublicKey: string

}
