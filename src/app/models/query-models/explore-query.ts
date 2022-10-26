/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { v4 as uuidv4 } from 'uuid';
import { Constraint } from '../constraint-models/constraint';
import { SequentialConstraint } from '../constraint-models/sequential-constraint';

export class ExploreQuery {

  private _uniqueId: string;
  private _name: string;
  private _description: string;
  // the constraint of the query
  private _constraint: Constraint;

  private _sequentialConstraint: SequentialConstraint;

  // the query-level i2b2 timing policy
  private _queryTimingSameInstanceNum: boolean;

  constructor(name?: string) {
    this.name = name;
    this.generateUniqueId();
  }

  /**
   * Generates a new unique ID for this query.
   */
  generateUniqueId(): void {
    this.uniqueId = uuidv4();
  }

  // --- getters / setters
  get uniqueId(): string {
    return this._uniqueId;
  }

  set uniqueId(uniqueId: string) {
    this._uniqueId = uniqueId;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get constraint(): Constraint {
    return this._constraint;
  }

  get sequentialConstraint(): SequentialConstraint {
    return this._sequentialConstraint;
  }

  set sequentialConstraint(sequentialConstraint: SequentialConstraint) {
    this._sequentialConstraint = sequentialConstraint;
  }

  set constraint(value: Constraint) {
    this._constraint = value;
  }

  set queryTimingSameInstanceNum(val: boolean) {
    this._queryTimingSameInstanceNum = val
  }

  get queryTimingSameInstanceNum(): boolean {
    return this._queryTimingSameInstanceNum
  }
}
