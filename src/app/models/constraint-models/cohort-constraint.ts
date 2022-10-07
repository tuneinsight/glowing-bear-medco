/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * Copyright 2020 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Constraint } from './constraint';
import { Cohort } from './../../models/constraint-models/cohort';
import { FormatHelper } from '../../utilities/format-helper';

export class CohortConstraint extends Constraint {
  private _cohort: Cohort;

  static NewCohortConstraintFromCohort(cohort: Cohort): CohortConstraint {
    const cohortConstraint = new CohortConstraint();
    cohortConstraint.cohort = cohort;
    cohortConstraint._textRepresentation = cohortConstraint.cohort.name;
    return cohortConstraint
  }

  constructor() {
    super();
    this._textRepresentation = 'Cohort';
  }

  clone(): CohortConstraint {
    let res = new CohortConstraint();
    res._textRepresentation = this.textRepresentation;
    res.parentConstraint = this.parentConstraint;

    return res;
  }

  get className(): string {
    return 'CohortConstraint';
  }

  get cohort(): Cohort {
    return this._cohort;
  }

  set cohort(cohort: Cohort) {
    this._cohort = cohort;
    this._textRepresentation = cohort ? `Cohort: ${cohort.name}` : FormatHelper.nullValuePlaceholder;
  }
}
