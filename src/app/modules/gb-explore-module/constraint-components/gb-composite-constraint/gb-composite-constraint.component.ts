import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Constraint } from 'src/app/models/constraint-models/constraint';
import { AutoComplete, DialogService } from 'primeng';
import { TreeNode } from '../../../../models/tree-models/tree-node';
import { AppConfig } from 'src/app/config/app.config';
import { CohortConstraint } from 'src/app/models/constraint-models/cohort-constraint';
import { Cohort as ConstraintCohort } from 'src/app/models/constraint-models/cohort';
import { CombinationConstraint } from 'src/app/models/constraint-models/combination-constraint';
import { CompositeConstraint } from 'src/app/models/constraint-models/composite-constraint';
import { GenomicAnnotationsService } from 'src/app/services/api/genomic-annotations.service';
import { CohortService } from 'src/app/services/cohort.service';
import { ConstraintService } from 'src/app/services/constraint.service';
import { QueryService } from 'src/app/services/query.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';
import { UIHelper } from 'src/app/utilities/ui-helper';
import { GbConstraintComponent } from '../gb-constraint/gb-constraint.component';
import { MessageHelper } from 'src/app/utilities/message-helper';
import { CombinationState } from 'src/app/models/constraint-models/combination-state';

@Component({
  selector: 'gb-composite-constraint',
  templateUrl: './gb-composite-constraint.component.html',
  styleUrls: ['./gb-composite-constraint.component.css', '../gb-constraint/gb-constraint.component.css']
})
export class GbCompositeConstraintComponent extends GbConstraintComponent implements OnInit {
  @ViewChild('autoComplete', { static: true }) autoComplete: AutoComplete;

  searchResults: Constraint[];
  selectedConstraint: Constraint;

  constructor(protected treeNodeService: TreeNodeService,
              protected cohortService: CohortService,
              protected constraintService: ConstraintService,
              protected queryService: QueryService,
              protected genomicAnnotationsService: GenomicAnnotationsService,
              protected element: ElementRef,
              protected config: AppConfig,
              protected dialogService: DialogService) {
    super(treeNodeService, cohortService, constraintService, queryService, genomicAnnotationsService, element, config)
  }

  ngOnInit(): void {
  }

  get children(): Constraint[] {
    return (<CompositeConstraint>this.constraint).children;
  }

  onConstraintRemoved(index: number) {
    (<CombinationConstraint>this.constraint).children.splice(index, 1);
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

      if (newConstraint.className === 'CompositeConstraint') {
        // we don't want to copy a CompositeConstraint's children
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

      const cohortConstraint = CohortConstraint.NewCohortConstraintFromCohort(constraintCohort)
      this.droppedConstraint = cohortConstraint;
      this.cohortService.selectedCohort = null;
    }

    this.addChildConstraint(this.droppedConstraint);
  }

  private addChildConstraint(constraint: Constraint) {
    let compositeConstraint: CompositeConstraint = <CompositeConstraint>this.constraint;
    try {
      // do not allow single concept at root of composite constraint
      if (compositeConstraint.isRoot) {
        let subCombinationConstraint = new CombinationConstraint()
        subCombinationConstraint.combinationState = CombinationState.Or;
        subCombinationConstraint.addChild(constraint)
        compositeConstraint.addChild(subCombinationConstraint)
      } else {
        compositeConstraint.addChild(constraint);
      }
    } catch (error) {
      MessageHelper.alert('error', error.message)
    }

    // force combination state to or for second-level combination constraint
    let parentConstraint = this.constraint.parentConstraint as CompositeConstraint;
    if (parentConstraint && parentConstraint.isRoot && (compositeConstraint instanceof CombinationConstraint)) {
      (compositeConstraint as CombinationConstraint).combinationState = CombinationState.Or;
    }

    this.autoComplete.selectItem(null);
    this.droppedConstraint = null;
    this.update();
  }

  get childContainerClass(): string {
    return (<CompositeConstraint>this.constraint).isRoot ?
      '' : 'gb-composite-constraint-child-container';
  }

  get compositeClassName(): string {
    return (this.constraint as CompositeConstraint).compositeClassName
  }

  addChildCombinationConstraint() {
    try {
      (<CombinationConstraint>this.constraint).addChild(new CombinationConstraint());
    } catch (error) {
      MessageHelper.alert('warn', error.message)
    }
  }

  allowGroupChildren(): boolean {
    if (!(this.constraint instanceof CompositeConstraint)) {
      return false;
    }

    return this.constraint.isRoot;
  }

}
