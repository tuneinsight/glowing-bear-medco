/**
 * Copyright 2021  CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export class OperationType {


  static readonly SELECT_PROJECT = 'Select project'
  static readonly EXPLORE = 'Cohort Selection'
  static readonly EXPLORE_STATISTICS = 'Reference Interval Estimation'
  static readonly ANALYSIS = 'Analysis'
  static readonly RESULTS = 'Results'

  static readonly ALL_TYPES = [
    OperationType.SELECT_PROJECT,
    OperationType.EXPLORE,
    OperationType.EXPLORE_STATISTICS,
    OperationType.ANALYSIS,
    OperationType.RESULTS
  ]

}
