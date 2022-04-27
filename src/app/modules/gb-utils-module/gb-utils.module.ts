/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TooltipModule } from 'primeng';
import { GbGenericTooltipComponent } from './gb-generic-tooltip.component';
import { PathDisplayerComponent } from './gb-utils.component';




 @NgModule({
   imports: [
     CommonModule,
     TooltipModule,
   ],
   exports: [
    GbGenericTooltipComponent,
    PathDisplayerComponent,
   ],
   declarations: [
    GbGenericTooltipComponent,
    PathDisplayerComponent,
   ],
 })
 export class GbUtilsModule {
 }
