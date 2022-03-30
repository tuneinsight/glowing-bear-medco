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

export class CombinationConstraint extends Constraint {
  public static readonly groupTextRepresentation = 'Group';

  private _children: Constraint[];
  private _combinationState: CombinationState;
  private _isRoot: boolean;



  constructor() {
    super();
    this._children = [];
    this.combinationState = CombinationState.And;
    this.isRoot = false;
  }

  // visitor pattern https://refactoring.guru/design-patterns/visitor
  accept<T>(v: ConstraintVisitor<T>): T {
    return v.visitCombinationConstraint(this)
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
    return;
  }

  updateChild(index: number, constraint: Constraint) {
    if (!(<CombinationConstraint>constraint).isRoot) {
      constraint.parentConstraint = this;
    }
    this.children[index] = constraint
    return;
  }

  clone(): CombinationConstraint {
    let res = new CombinationConstraint;
    res.parentConstraint = (this.parentConstraint) ? this.parentConstraint : null;
    res.isRoot = this.isRoot;
    res.excluded = this.excluded
    res.combinationState = this.combinationState;
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

  removeChildConstraint(child: Constraint) {
    let index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
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
    if (this.children.length === 0) {
      return CombinationConstraint.groupTextRepresentation;
    }

    return (this.excluded ? 'not (' : '(') + this.children.map(({ textRepresentation }) => textRepresentation)
      .join(this.combinationState === CombinationState.And ? ' and ' : ' or ') + ')'

  }

}
