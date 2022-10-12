/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2019 - 2020  LDS EPFL
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable } from '@angular/core';
import { CombinationConstraint } from '../models/constraint-models/combination-constraint';
import { Constraint } from '../models/constraint-models/constraint';
import { Concept } from '../models/constraint-models/concept';
import { ConceptConstraint } from '../models/constraint-models/concept-constraint';
import { CombinationState } from '../models/constraint-models/combination-state';
import { DropMode } from '../models/drop-mode';
import { TreeNodeService } from './tree-node.service';
import { TreeNode } from '../models/tree-models/tree-node';
import { ConstraintHelper } from '../utilities/constraint-utilities/constraint-helper';
import { TreeNodeType } from '../models/tree-models/tree-node-type';
import { GenomicAnnotationConstraint } from '../models/constraint-models/genomic-annotation-constraint';
import { GenomicAnnotation } from '../models/constraint-models/genomic-annotation';
import { ErrorHelper } from '../utilities/error-helper';
import { OperationType } from '../models/operation-models/operation-types';
import { MessageHelper } from '../utilities/message-helper';
import { QueryTemporalSetting } from '../models/query-models/query-temporal-setting';
import { ApiI2b2SequentialOperator } from '../models/api-request-models/medco-node/api-sequence-of-events/api-i2b2-sequential-operator';
import { SequentialConstraint } from '../models/constraint-models/sequential-constraint';

/**
 * This service concerns with
 * (1) translating string or JSON objects into Constraint class instances
 * (2) clear or restore constraints
 */
@Injectable()
export class ConstraintService {

  private _rootSelectionConstraint: CombinationConstraint;
  private _rootSequentialConstraint: SequentialConstraint;

  /*
   * List keeping track of all available constraints.
   * By default, the empty, constraints are in here.
   * In addition, (partially) filled constraints are added.
   * The constraints should be copied when editing them.
   */
  private _allConstraints: Constraint[] = [];
  private _concepts: Concept[] = [];
  private _conceptLabels: string[] = [];
  private _conceptConstraints: Constraint[] = [];
  private _genomicAnnotations: GenomicAnnotation[] = [];

  /*
   * The maximum number of search results allowed when searching for a constraint
   */
  private _maxNumSearchResults = 100;

  /*
   * It changes the way to handle internal states of ConstraintService
   */
  private _operationType: OperationType;

  // internal states to save when changing operationType
  private _exploreRootSelectionConstraint: CombinationConstraint;
  private _exploreRootSequentialConstraint: SequentialConstraint;

  public static depthOfConstraint(constraint: Constraint): number {
    let depth = 0;
    if (constraint.parentConstraint !== null) {
      depth++;
      depth += this.depthOfConstraint(constraint.parentConstraint);
    }
    return depth;
  }

  constructor(private treeNodeService: TreeNodeService) {
    // Initialize the root constraints in the 1st step
    this.rootSelectionConstraint = new CombinationConstraint();
    this.rootSelectionConstraint.isRoot = true;
    this.rootSequentialConstraint = new SequentialConstraint();
    this.rootSequentialConstraint.isRoot = true;

  }

  /**
   * Returns a list of all constraints that match the query string.
   * The constraints should be copied when editing them.
   * @param query
   * @returns {Array}
   */
  public searchAllConstraints(query: string): Constraint[] {
    query = query.toLowerCase();
    let results = [];
    if (query === '') {
      results = [].concat(this.allConstraints.slice(0, this.maxNumSearchResults));
    } else if (query && query.length > 0) {
      let count = 0;
      this.allConstraints.forEach((constraint: Constraint) => {
        let text = constraint.textRepresentation.toLowerCase();
        if (text.indexOf(query) > -1) {
          results.push(constraint);
          count++;
          if (count >= this.maxNumSearchResults) {
            return results;
          }
        }
      });
    }
    return results;
  }

  public hasSelectionConstraint(): Boolean {
    return ConstraintHelper.hasNonEmptyChildren(this.rootSelectionConstraint);
  }

  public hasSequentialConstraint(): Boolean {
    if (this.rootSequentialConstraint.children.length < 2) {
      return false;
    }
    return ConstraintHelper.hasNonEmptyChildren(this.rootSequentialConstraint);
  }

  /**
   * validateConstraintValues returns empty string if the values are valid. This applies to constraint with an operator
   * such textual or numerical constraint. If the operator is undefined or if this does not apply to a constraint, empty string
   * is returned by default.
   */
  public validateConstraintValues(): string {
    let constraintValidity = ''
    if (this.hasSelectionConstraint()) {
      constraintValidity = this.rootSelectionConstraint.inputValueValidity()
      if (constraintValidity !== '') {
        return constraintValidity
      }

    }
    if (this.hasSequentialConstraint()) {
      constraintValidity = this.rootSequentialConstraint.inputValueValidity()
    }

    return constraintValidity
  }

  /**
   * Generate the constraint corresponding to the query.
   */
   public generateConstraint(): CombinationConstraint {
    return this.rootSelectionConstraint;
  }

  /**
   * Clear the patient constraints
   */
  public clearConstraint() {
    this.rootSelectionConstraint.children.length = 0;
    this.rootSequentialConstraint.children.length = 0;
    if (!!(this.rootSequentialConstraint.temporalSequence)) {
      this.rootSequentialConstraint.temporalSequence.length = 0;
    }
  }

  // generate the constraint instance based on given node (e.g. tree node)
  public generateConstraintFromTreeNode(selectedNode: TreeNode, dropMode: DropMode): Constraint {
    let constraint: Constraint = null;
    // if the dropped node is a tree node
    if (dropMode === DropMode.TreeNode) {
      let treeNode = selectedNode;
      switch (treeNode.nodeType) {

        case TreeNodeType.CONCEPT:
        case TreeNodeType.CONCEPT_FOLDER:
          let concept = this.treeNodeService.getConceptFromTreeNode(treeNode);
          constraint = new ConceptConstraint(treeNode);
          (<ConceptConstraint>constraint).concept = concept;
          break;

        case TreeNodeType.GENOMIC_ANNOTATION:
          // case where node is a genomic annotation
          constraint = new GenomicAnnotationConstraint();
          (<GenomicAnnotationConstraint>constraint).annotation.displayName = treeNode.displayName;
          (<GenomicAnnotationConstraint>constraint).annotation.name = treeNode.name;
          (<GenomicAnnotationConstraint>constraint).annotation.path = treeNode.path;
          break;

        case TreeNodeType.MODIFIER:
        case TreeNodeType.MODIFIER_FOLDER:
          let sourceConcept = this.treeNodeService.getConceptFromModifierTreeNode(treeNode);
          constraint = new ConceptConstraint(treeNode);
          (<ConceptConstraint>constraint).concept = sourceConcept;
          break;

        case TreeNodeType.UNKNOWN:
          let descendants = [];
          this.treeNodeService.getTreeNodeDescendantsWithExcludedTypes(
            selectedNode,
            [TreeNodeType.UNKNOWN],
            descendants
          );

          if (descendants.length < 6) {
            constraint = new CombinationConstraint();
            (<CombinationConstraint>constraint).combinationState = CombinationState.Or;
            for (let descendant of descendants) {
              let dConstraint = this.generateConstraintFromTreeNode(descendant, DropMode.TreeNode);
              if (dConstraint) {
                (<CombinationConstraint>constraint).addChild(dConstraint);
              }
            }
            if ((<CombinationConstraint>constraint).children.length === 0) {
              constraint = null;
            }
          } else {
            console.warn(`Too many descendants: ${descendants.length}`);
          }
          break;

        case TreeNodeType.CONCEPT_CONTAINER:
        case TreeNodeType.MODIFIER_CONTAINER:
          MessageHelper.alert('warn', `${treeNode.name} is a container and cannot be used`)
          break;
        default:
          MessageHelper.alert('warn', `Could not get constraint from node ${treeNode.path}`);
          break;
      }
    }

    return constraint;
  }

  get sequentialInfo(): ApiI2b2SequentialOperator[] {
    return this.rootSequentialConstraint.temporalSequence.map((sequenceInfoElm) => sequenceInfoElm.clone())

  }

  set sequentialInfo(sequenceInfo: ApiI2b2SequentialOperator[]) {
    this.rootSequentialConstraint.temporalSequence = sequenceInfo.map(sequenceInfoElm => sequenceInfoElm.clone())
  }

  set operationType(opType: OperationType) {

    switch (opType) {
      case OperationType.EXPLORE:

        // reload previous selection
        if (this._operationType === OperationType.ANALYSIS) {
          if (this._exploreRootSelectionConstraint) {
            this.rootSelectionConstraint = this._exploreRootSelectionConstraint
          }
          if (this._exploreRootSequentialConstraint) {
            this.rootSequentialConstraint = this._exploreRootSequentialConstraint
          }
        }

        this._operationType = opType
        break;
      case OperationType.ANALYSIS:

        // save current selection
        if (this._operationType === OperationType.EXPLORE) {
          this._exploreRootSelectionConstraint = this.rootSelectionConstraint.clone()
          this._exploreRootSequentialConstraint = this.rootSequentialConstraint.clone()
          this.clearConstraint()
        }
        this._operationType = opType
        break;
      default:

        MessageHelper.alert('warn', `The operation type ${opType} is unknown. Previous internal states of constraint service apply ()${this._operationType}.`)
        break;
    }
    console.log(`The operation type of constraint service is now ${this._operationType}.`)
  }

  get operationType(): OperationType {
    return this._operationType
  }

  get rootSelectionConstraint(): CombinationConstraint {
    return this._rootSelectionConstraint;
  }

  set rootSelectionConstraint(value: CombinationConstraint) {
    this._rootSelectionConstraint = value;
  }

  get rootSequentialConstraint(): SequentialConstraint {
    return this._rootSequentialConstraint;
  }

  set rootSequentialConstraint(value: SequentialConstraint) {
    this._rootSequentialConstraint = value;
  }

  get allConstraints(): Constraint[] {
    return this._allConstraints;
  }

  set allConstraints(value: Constraint[]) {
    this._allConstraints = value;
  }

  get conceptConstraints(): Constraint[] {
    return this._conceptConstraints;
  }

  set conceptConstraints(value: Constraint[]) {
    this._conceptConstraints = value;
  }

  get concepts(): Concept[] {
    return this._concepts;
  }

  set concepts(value: Concept[]) {
    this._concepts = value;
  }

  get conceptLabels(): string[] {
    return this._conceptLabels;
  }

  set conceptLabels(value: string[]) {
    this._conceptLabels = value;
  }

  get maxNumSearchResults(): number {
    return this._maxNumSearchResults;
  }

  set maxNumSearchResults(value: number) {
    this._maxNumSearchResults = value;
  }

  get genomicAnnotations(): GenomicAnnotation[] {
    return this._genomicAnnotations;
  }

  set genomicAnnotations(value: GenomicAnnotation[]) {
    this._genomicAnnotations = value;
  }

}

