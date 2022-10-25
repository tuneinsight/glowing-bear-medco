/**
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Constraint } from './constraint';

export abstract class CompositeConstraint extends Constraint {

  protected _children: Constraint[];
  protected _isRoot: boolean;

  abstract clone(): CompositeConstraint;
  abstract get textRepresentation(): string;
  get className(): string {
    return 'CompositeConstraint';
  }
  abstract get compositeClassName(): string;

  constructor() {
    super()
    this._children = [];

    this._isRoot = false;
  }

  addChild(constraint: Constraint) {

    if (!(<CompositeConstraint>constraint).isRoot) {
      // to enforce polymorphism, otherwise child set method is not called
      constraint.parentConstraint = this;
    }
    this.children.push(constraint);
    return;
  }

  updateChild(index: number, constraint: Constraint) {
    if (!(<CompositeConstraint>constraint).isRoot) {
      constraint.parentConstraint = this;
    }
    this.children[index] = constraint

    return;
  }

  /**
   *  the input value validity of a composite constraint is true if all children constraints have valid values.
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

  get isRoot(): boolean {
    return this._isRoot;
  }

  set isRoot(value: boolean) {
    this._isRoot = value;
  }


}
