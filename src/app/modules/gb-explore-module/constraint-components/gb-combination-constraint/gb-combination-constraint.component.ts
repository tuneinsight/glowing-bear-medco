/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GbConstraintComponent } from '../gb-constraint/gb-constraint.component';
import { CombinationConstraint } from '../../../../models/constraint-models/combination-constraint';
import { Constraint } from '../../../../models/constraint-models/constraint';
import { AutoComplete } from 'primeng';
import { CombinationState } from '../../../../models/constraint-models/combination-state';
import { TreeNode } from '../../../../models/tree-models/tree-node';
import { UIHelper } from '../../../../utilities/ui-helper';
import {MessageHelper} from '../../../../utilities/message-helper';
import { Cohort } from 'src/app/models/cohort-models/cohort';
import { Cohort as ConstraintCohort } from 'src/app/models/constraint-models/cohort';
import { CohortConstraint } from 'src/app/models/constraint-models/cohort-constraint';
import { GbCompositeConstraintComponent } from '../gb-composite-constraint/gb-composite-constraint.component';
import { AppConfig } from 'src/app/config/app.config';
import { GenomicAnnotationsService } from 'src/app/services/api/genomic-annotations.service';
import { CohortService } from 'src/app/services/cohort.service';
import { ConstraintService } from 'src/app/services/constraint.service';
import { QueryService } from 'src/app/services/query.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';
import { DialogService } from 'primeng';

@Component({
  selector: 'gb-combination-constraint',
  templateUrl: './gb-combination-constraint.component.html',
  styleUrls: ['./gb-combination-constraint.component.css', '../gb-composite-constraint/gb-composite-constraint.component.css', '../gb-constraint/gb-constraint.component.css'],
})
export class GbCombinationConstraintComponent extends GbCompositeConstraintComponent implements OnInit {

  CombinationState = CombinationState;

  constructor(protected treeNodeService: TreeNodeService,
              protected cohortService: CohortService,
              protected constraintService: ConstraintService,
              protected queryService: QueryService,
              protected genomicAnnotationsService: GenomicAnnotationsService,
              protected element: ElementRef,
              protected config: AppConfig,
              protected dialogService: DialogService) {
    super(treeNodeService, cohortService, constraintService, queryService, genomicAnnotationsService, element, config, dialogService)
  }

  ngOnInit() {
  }

  get isAnd(): boolean {
    return (<CombinationConstraint>this.constraint).isAnd();
  }

  get combinationState() {
    return (<CombinationConstraint>this.constraint).combinationState;
  }

}
