/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Constraint } from './constraint';
import { FormatHelper } from '../../utilities/format-helper';
import { ConstraintVisitor } from './constraintVisitor';

export class ValueConstraint extends Constraint {

  private _operator: string;
  private _value: any;

  constructor() {
    super();
    this.textRepresentation = 'Value';
  }

  // visitor pattern https://refactoring.guru/design-patterns/visitor
  accept<T>(v: ConstraintVisitor<T>): T {
    return v.visitValueConstraint(this)
  }

  get operator(): string {
    return this._operator;
  }

  set operator(value: string) {
    this._operator = value;
  }

  get value(): any {
    return this._value;
  }

  set value(value: any) {
    this._value = value;
    this.textRepresentation = value ? FormatHelper.nullValuePlaceholder : value.toString();
  }

  get className(): string {
    return 'ValueConstraint';
  }
}
