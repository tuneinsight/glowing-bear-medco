/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Constraint } from './constraint';
import { CombinationState } from './combination-state';
import { ApiI2b2TimingSequenceInfo } from '../api-request-models/medco-node/api-sequence-of-events/api-i2b2-timing-sequence-info';

export class CombinationConstraint extends Constraint {

  private _children: Constraint[];
  private _temporalSequence: ApiI2b2TimingSequenceInfo[];
  private _combinationState: CombinationState;
  private _isRoot: boolean;


  constructor() {
    super();
    this._children = [];
    this.combinationState = CombinationState.And;
    this.isRoot = false;
    this.textRepresentation = 'Group';
  }

  get className(): string {
    return 'CombinationConstraint';
  }

  addChild(constraint: Constraint) {

    if (!(<CombinationConstraint>constraint).isRoot) {
      // to enforce polymorphism, otherwise child set method is not called
      constraint.parentConstraint = this;
    }
    this.children.push(constraint);
    this.updateTextRepresentation();
    return;
  }

  updateChild(index: number, constraint: Constraint) {
    if (!(<CombinationConstraint>constraint).isRoot) {
      constraint.parentConstraint = this;
    }
    this.children[index] = constraint
    this.updateTextRepresentation();
    return;
  }

  clone(): CombinationConstraint {
    let res = new CombinationConstraint;
    res.textRepresentation = this.textRepresentation;
    res.parentConstraint = (this.parentConstraint) ? this.parentConstraint : null;
    res.isRoot = this.isRoot;
    res.combinationState = this.combinationState;
    res._temporalSequence = this._temporalSequence.map(sequenceInfo => sequenceInfo.clone());
    res.panelTimingSameInstance = this.panelTimingSameInstance;
    res.children = this._children.map(constr => constr.clone());
    return res;
  }

  isAnd() {
    return this.combinationState === CombinationState.And;
  }

  /**
   *  the input value validity of a combination constraint is true if all children constraints have valid values.
   *  If one or multiple children are not valid, only the first non-empty message string is returned
   */
  inputValueValidity(): string {

    for (const child of this.children) {
      let validity = child.inputValueValidity()
      if (validity !== '') {
        return validity
      }
    }
    return ''
  }


  get children(): Constraint[] {
    return this._children;
  }

  set children(value: Constraint[]) {
    this._children = value;
    this.updateSequences();
    this.updateTextRepresentation();
  }

  get combinationState(): CombinationState {
    return this._combinationState;
  }

  set combinationState(value: CombinationState) {
    this._combinationState = value;
    if (this._combinationState === CombinationState.TemporalSequence) {
      this.updateSequences()
    }
    this.updateTextRepresentation();
  }

  get temporalSequence(): ApiI2b2TimingSequenceInfo[] {
    return this._temporalSequence
  }

  switchCombinationState() {
    this.combinationState = (this.combinationState === CombinationState.And) ?
      CombinationState.Or : CombinationState.And;
    this.updateTextRepresentation();
  }

  removeChildConstraint(child: Constraint) {
    let index = this.children.indexOf(child);
    if (index > -1) {
      if (this.children.length > 1) {
        this._temporalSequence.splice(Math.max(index - 1, 0), 1)
        this.updateSequences()
      }
      this.children.splice(index, 1);
    }
    this.updateTextRepresentation();
  }

  updateSequences() {
    if (this._temporalSequence !== null) {
      if ((this._children)) {
        this._temporalSequence = Array<ApiI2b2TimingSequenceInfo>(this._children.length)
        this._temporalSequence.fill(new ApiI2b2TimingSequenceInfo())
      }
    } else {
      if ((this._children)) {
        if (this._children.length > this._temporalSequence.length) {
          let newSequences = Array<ApiI2b2TimingSequenceInfo>(this._children.length - this._temporalSequence.length)
          newSequences.fill(new ApiI2b2TimingSequenceInfo())
          this._temporalSequence = this._temporalSequence.concat(newSequences)
        } else if (this._children.length < this._temporalSequence.length) {
          // this is not expected as this situation can be handled by removeChildren
          this._temporalSequence.splice(this._children.length - 1, this._temporalSequence.length - this._children.length)
        }
      }
    }
  }

  get isRoot(): boolean {
    return this._isRoot;
  }

  set isRoot(value: boolean) {
    this._isRoot = value;
  }


  private updateTextRepresentation() {
    if (this.children.length > 0) {
      let newRepresentation = ''
      for (let index = 0; index < this.children.length; index++) {

        let representation = this.children[index].textRepresentation
        if (index > 0) {
          let combinationRepresentation: string
          switch (this.combinationState) {
            case CombinationState.And:
              combinationRepresentation = 'and'
              break;
            case CombinationState.Or:
              combinationRepresentation = 'or'
              break;
            case CombinationState.TemporalSequence:
              combinationRepresentation = this._temporalSequence[index - 1].textRepresentation
              break;
            default:
              break;
          }
          representation = ` ${combinationRepresentation} ${representation}`
        }
        newRepresentation = `${newRepresentation}${representation}`
      }

      this.textRepresentation = `(${newRepresentation})`
    } else {
      this.textRepresentation = 'Group';
    }
  }
}
