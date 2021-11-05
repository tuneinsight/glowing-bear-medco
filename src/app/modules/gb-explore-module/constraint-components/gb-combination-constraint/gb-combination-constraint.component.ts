/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GbConstraintComponent } from '../gb-constraint/gb-constraint.component';
import { CombinationConstraint } from '../../../../models/constraint-models/combination-constraint';
import { Constraint } from '../../../../models/constraint-models/constraint';
import { AutoComplete, Dialog, DynamicDialogConfig, DynamicDialogRef } from 'primeng';
import { CombinationState } from '../../../../models/constraint-models/combination-state';
import { TreeNode } from '../../../../models/tree-models/tree-node';
import { UIHelper } from '../../../../utilities/ui-helper';
import { MessageHelper } from '../../../../utilities/message-helper';
import { Cohort as ConstraintCohort } from 'src/app/models/constraint-models/cohort';
import { CohortConstraint } from 'src/app/models/constraint-models/cohort-constraint';
import { AppConfig } from 'src/app/config/app.config';
import { GenomicAnnotationsService } from 'src/app/services/api/genomic-annotations.service';
import { CohortService } from 'src/app/services/cohort.service';
import { ConstraintService } from 'src/app/services/constraint.service';
import { QueryService } from 'src/app/services/query.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';
import { DialogService } from 'primeng';
import { GbTemporalSequenceComponent } from './gb-temporal-sequence/gb-temporal-sequence.component';
import { ApiI2b2TimingSequenceInfo } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-timing-sequence-info';
import { Subject } from 'rxjs';
import { ApiI2b2SequentialOperator } from 'src/app/models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import { delay, startWith } from 'rxjs/operators';


@Component({
  selector: 'gb-combination-constraint',
  templateUrl: './gb-combination-constraint.component.html',
  styleUrls: ['./gb-combination-constraint.component.css', '../gb-constraint/gb-constraint.component.css'],
})
export class GbCombinationConstraintComponent extends GbConstraintComponent implements OnInit {
  CombinationState = CombinationState;

  @ViewChild('autoComplete', { static: true }) autoComplete: AutoComplete;

  searchResults: Constraint[];
  selectedConstraint: Constraint;

  // onClose is not firing from the dynamic dialog, a "hand-made" RXJS subject is thus required
  _sequenceInfoSubject: Subject<ApiI2b2TimingSequenceInfo>;



  constructor(protected treeNodeService: TreeNodeService,
    protected cohortService: CohortService,
    protected constraintService: ConstraintService,
    protected queryService: QueryService,
    protected genomicAnnotationsService: GenomicAnnotationsService,
    protected element: ElementRef,
    protected config: AppConfig,
    private dialogService: DialogService) {
    super(treeNodeService, cohortService, constraintService, queryService, genomicAnnotationsService, element, config)
  }
  ngOnInit() {
  }

  get isAnd(): boolean {
    return (<CombinationConstraint>this.constraint).isAnd();
  }

  get children(): Constraint[] {
    return (<CombinationConstraint>this.constraint).children;
  }

  /**
   * Removes the childConstraint from the CombinationConstraint corresponding to this component.
   * @param childConstraint
   */
  onConstraintRemoved(childConstraint: Constraint) {
    (<CombinationConstraint>this.constraint).removeChildConstraint(childConstraint);
    this.update();
  }

  onSearch(event) {
    this.searchResults = this.constraintService.searchAllConstraints(event.query);
  }

  onDropdown(event) {
    this.searchResults = this.constraintService.searchAllConstraints('');
    UIHelper.removePrimeNgLoaderIcon(this.element, 200);
  }

  onSelect(selectedConstraint) {
    if (selectedConstraint != null) {

      // Create a copy of the selected constraint
      let newConstraint: Constraint = new selectedConstraint.constructor();
      Object.assign(newConstraint, this.selectedConstraint);

      if (newConstraint.className === 'CombinationConstraint') {
        // we don't want to copy a CombinationConstraint's children
        (<CombinationConstraint>newConstraint).children = [];
      }

      this.addChildConstraint(newConstraint);
    }
  }

  onDrop(event) {
    event.stopPropagation();
    let selectedNode: TreeNode = this.treeNodeService.selectedTreeNode;

    if (selectedNode) {
      this.droppedConstraint =
        this.constraintService.generateConstraintFromTreeNode(selectedNode, selectedNode ? selectedNode.dropMode : null);
      this.treeNodeService.selectedTreeNode = null;
    } else {
      const constraintCohort = new ConstraintCohort();
      constraintCohort.name = this.cohortService.selectedCohort.name;

      const cohortConstraint = new CohortConstraint();
      cohortConstraint.cohort = constraintCohort;
      cohortConstraint.textRepresentation = cohortConstraint.cohort.name;
      this.droppedConstraint = cohortConstraint;
      this.cohortService.selectedCohort = null;
    }

    this.addChildConstraint(this.droppedConstraint);
  }

  temporalStringRepresentation(operator: ApiI2b2SequentialOperator): string {
    switch (operator) {
      case ApiI2b2SequentialOperator.lessequal:
        return 'before or same time as'
      case ApiI2b2SequentialOperator.equal:
        return 'same time as'
      case ApiI2b2SequentialOperator.less:
      default:
        return 'before'
    }
  }

  showTemporal(idx: number) {
    let config = new DynamicDialogConfig()
    let currentSequence = (!(this.temporalSequence) || (this.temporalSequence.length === 0)) ?
    new ApiI2b2TimingSequenceInfo() : this.temporalSequence[idx]
    this._sequenceInfoSubject = new Subject<ApiI2b2TimingSequenceInfo>()
    this._sequenceInfoSubject
      .pipe(
        // without this two following lines, a 'Expression has changed after it was checked'
        // solution at https://blog.angular-university.io/angular-debugging/
        startWith(currentSequence),
        delay(0))
      .subscribe(info => {
        if (!(this.temporalSequence) || (this.temporalSequence.length === 0)) {
          this.temporalSequence = new Array<ApiI2b2TimingSequenceInfo>(this.children.length - 1)
          this.temporalSequence.forEach((_, index) => this.temporalSequence[index] = new ApiI2b2TimingSequenceInfo())
        }
        this.temporalSequence[idx] = info
      }
      )
    config.data = {
      sequenceInfo: currentSequence,
      sequenceInfoSubject: this._sequenceInfoSubject,
    }
    config.header = 'Define advanced temporal sequence operator'

    this.dialogService.open(GbTemporalSequenceComponent, config)
  }

  private addChildConstraint(constraint: Constraint) {
    let combinationConstraint: CombinationConstraint = <CombinationConstraint>this.constraint;
    try {
      // do not allow single concept at root of combination constraint
      if (combinationConstraint.isRoot) {
        let subCombinationConstraint = new CombinationConstraint()
        subCombinationConstraint.combinationState = CombinationState.Or;
        subCombinationConstraint.addChild(constraint)
        combinationConstraint.addChild(subCombinationConstraint)
      } else {
        combinationConstraint.addChild(constraint);
      }
    } catch (error) {
      MessageHelper.alert('error', error.message)
    }

    // force combination state to or for second-level combination constraint
    let parentConstraint = this.constraint.parentConstraint as CombinationConstraint;
    if (parentConstraint && parentConstraint.isRoot) {
      combinationConstraint.combinationState = CombinationState.Or;
    }

    this.autoComplete.selectItem(null);
    this.droppedConstraint = null;
    this.update();
  }

  get combinationState() {
    return (<CombinationConstraint>this.constraint).combinationState;
  }

  get temporalSequence(): ApiI2b2TimingSequenceInfo[] {
    return (<CombinationConstraint>this.constraint).temporalSequence;
  }

  set temporalSequence(sequence: ApiI2b2TimingSequenceInfo[]) {
    (<CombinationConstraint>this.constraint).temporalSequence = sequence
  }

  get childContainerClass(): string {
    return (<CombinationConstraint>this.constraint).isRoot ?
      '' : 'gb-combination-constraint-child-container';
  }

  addChildCombinationConstraint() {
    try {
      (<CombinationConstraint>this.constraint).addChild(new CombinationConstraint());
    } catch (error) {
      MessageHelper.alert('warn', error.message)
    }
  }

  allowGroupChildren(): boolean {
    if (!(this.constraint instanceof CombinationConstraint)) {
      return false;
    }

    return this.constraint.isRoot;
  }
}
