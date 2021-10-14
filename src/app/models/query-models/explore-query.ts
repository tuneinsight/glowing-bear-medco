/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ApiI2b2TimingSequenceInfo } from '../api-request-models/medco-node/api-sequence-of-events/api-i2b2-timing-sequence-info';
import { Constraint } from '../constraint-models/constraint';

export class ExploreQuery {

  private _uniqueId: string;
  private _name: string;
  private _description: string;
  // the constraint of the query
  private _constraint: Constraint;

  // the query-level i2b2 timing policy
  private _queryTimingSameInstanceNum: boolean;

  // the list of sequential operators
  private _timingSequenceInfo: ApiI2b2TimingSequenceInfo[];

  constructor(name?: string) {
    this.name = name;
    this.generateUniqueId();
  }

  /**
   * Generates a new unique ID for this query.
   */
  generateUniqueId(): void {
    let d = new Date();
    let id = `MedCo_Explore_Query_${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDate()}${d.getUTCHours()}` +
      `${d.getUTCMinutes()}${d.getUTCSeconds()}${d.getUTCMilliseconds()}`;

    if (this.name) {
      // embed name without whitespaces if defined
      id = `${id}_${this.name.replace(/\s/g, '_')}`;
    }

    this.uniqueId = id;
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

  set constraint(value: Constraint) {
    this._constraint = value;
  }

  set queryTimingSameInstanceNum(val: boolean) {
    this._queryTimingSameInstanceNum = val
  }

  get queryTimingSameInstanceNum(): boolean {
    return this._queryTimingSameInstanceNum
  }

  set timingSequenceInfo(sequenceInfo: ApiI2b2TimingSequenceInfo[]) {
    this._timingSequenceInfo = sequenceInfo
  }

  get timingSequenceInfo(): ApiI2b2TimingSequenceInfo[] {
    return this._timingSequenceInfo
  }
}
