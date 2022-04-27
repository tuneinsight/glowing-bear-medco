/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'gb-generic-tooltip',
  templateUrl: './gb-tooltip.component.html',
})
export class GbGenericTooltipComponent   {

  _infos: string;

  canDisplay(): boolean {
    return true
  }

  @Input()
  public set infos(infos: string) {
    this._infos = infos
  }

  public get infos(): string {
    return this._infos
  }
}
