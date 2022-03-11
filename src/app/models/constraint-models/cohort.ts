/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export class Cohort {
  private _name: string;
  private _exploreQueryId: string;

  constructor() {
  }

  clone(): Cohort {
    let ret = new Cohort();

    ret.name = this.name;
    ret.exploreQueryId = this.exploreQueryId;

    return ret;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get exploreQueryId(): string {
    return this._exploreQueryId;
  }

  set exploreQueryId(value: string) {
    this._exploreQueryId = value;
  }
}
