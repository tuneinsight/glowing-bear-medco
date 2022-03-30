/**
 * Copyright 2020 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// This class describes an interval from a histogram.
export class ApiInterval {
  encCount: string // the encrypted count of observations that fall within this interval
  higherBound: string
  lowerBound: string
}

// describes a histogram received from the backend after an explore-statistics request
export class ApiExploreStatisticsResponse {
  globalTimers: {
    name: string
    milliseconds: number
  }[]
  /*The ID of the record saved in the medco db which contains information about the patient
  * set of the cohort corresponding to the inclusion/exclusion criterias specified by the user
  */
  cohortQueryID: number
  // ID returned by the i2b2 query about the cohort based on the inclusion and exclusion constraints fed the input of the front end query.
  patientSetID: number
  // list of encrypted masked patient IDs.
  encryptedPatientList: string[]
  // per site count of the patient matching the cohort linked to the inclusion and exclusion criterias of the query
  encryptedCohortCount: string

  // Each item of this array contains the histogram of a specific analyte (concept or modifier).
  results: ApiExploreStatisticResult[]
}

export class ApiExploreStatisticResult {
  analyteName: string

  intervals: ApiInterval[]

  unit: string // the unit of the x-axis of the histogram

  timers: {
    name: string
    milliseconds: number
  }[]
}
