/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 CHUV
 * Copyright 2021 EPFL LDS
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CohortConstraint } from 'src/app/models/constraint-models/cohort-constraint';
import { CombinationConstraint } from 'src/app/models/constraint-models/combination-constraint';
import { ConceptConstraint } from 'src/app/models/constraint-models/concept-constraint';
import { GenomicAnnotationConstraint } from 'src/app/models/constraint-models/genomic-annotation-constraint';
import { TimeConstraint } from 'src/app/models/constraint-models/time-constraint';
import { ValueConstraint } from 'src/app/models/constraint-models/value-constraint';
import { Constraint } from './constraint';

 /* Using the visitor pattern to export the constraint as HTML:
 * https://refactoring.guru/design-patterns/visitor
 */
 export interface ConstraintVisitor<T> {
   visitCohortConstraint(c: CohortConstraint): T

   visitCombinationConstraint(c: CombinationConstraint): T

   visitConceptConstraint(c: ConceptConstraint): T

   visitConstraint(c: Constraint): T

   visitGenomicAnnotationConstraint(c: GenomicAnnotationConstraint): T

   visitTimeConstraint(c: TimeConstraint): T

   visitValueConstraint(c: ValueConstraint): T

 }
