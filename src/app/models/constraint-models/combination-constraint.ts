/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CombinationState } from './combination-state';
import { Constraint } from './constraint';
import { ConstraintVisitor } from './constraintVisitor';
import { CompositeConstraint } from './composite-constraint';

export class CombinationConstraint extends CompositeConstraint {

  private _combinationState: CombinationState;

  constructor() {
    super();
    this.combinationState = CombinationState.And;
  }

  // visitor pattern https://refactoring.guru/design-patterns/visitor
  accept<T>(v: ConstraintVisitor<T>): T {
    return v.visitCombinationConstraint(this)
  }

  get compositeClassName(): string {
    return 'CombinationConstraint';
  }

  updateChild(index: number, constraint: Constraint) {
    if (!(<CombinationConstraint>constraint).isRoot) {
      constraint.parentConstraint = this;
    }
    this.children[index] = constraint
    return;
  }

  clone(): CombinationConstraint {
    let res = new CombinationConstraint();
    res._textRepresentation = this.textRepresentation;
    res.parentConstraint = (this.parentConstraint) ? this.parentConstraint : null;
    res.isRoot = this.isRoot;
    res.excluded = this.excluded
    res.combinationState = this.combinationState;
    res.panelTimingSameInstance = this.panelTimingSameInstance;
    res.children = this.children.map(constr => constr.clone());
    return res;
  }

  isAnd() {
    return this.combinationState === CombinationState.And;
  }


  get children(): Constraint[] {
    return this._children;
  }

  set children(value: Constraint[]) {
    this._children = value;
  }

  get combinationState(): CombinationState {
    return this._combinationState;
  }

  set combinationState(value: CombinationState) {
    this._combinationState = value;
  }

  switchCombinationState() {
    this.combinationState = (this.combinationState === CombinationState.And) ?
      CombinationState.Or : CombinationState.And;
  }

  get isRoot(): boolean {
    return this._isRoot;
  }

  set isRoot(value: boolean) {
    this._isRoot = value;
  }

  set textRepresentation(r) {

  }


  get textRepresentation(): string {
    if (this.children.length > 0) {
      let newRepresentation = ''
      for (let index = 0; index < this.children.length; index++) {

        let representation = this.children[index].textRepresentation
        if (index > 0) {
          let combinationRepresentation = this.combinationState === CombinationState.And ? 'and' : 'or'
          representation = ` ${combinationRepresentation} ${representation}`
        }
        newRepresentation = `${newRepresentation}${representation}`
      }

      return this.excluded ? 'not ' : '' + `(${newRepresentation})`
    } else {
      return 'Group';
    }
  }

}
