/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GbSelectProjectComponent} from './gb-select-project.component';
import {routing} from './gb-select-project.routing';
import {AccordionModule} from 'primeng';
import {OverlayPanelModule} from 'primeng';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AutoCompleteModule} from 'primeng';
import {CheckboxModule} from 'primeng';
import {CalendarModule} from 'primeng';
import {PanelModule} from 'primeng';
import {InputSwitchModule} from 'primeng';
import {MultiSelectModule} from 'primeng';
import {TooltipModule} from 'primeng/tooltip';
import { GbUtilsModule } from '../gb-utils-module/gb-utils.module';


@NgModule({
  imports: [
    CommonModule,
    AccordionModule,
    OverlayPanelModule,
    routing,
    FormsModule,
    AutoCompleteModule,
    CheckboxModule,
    CalendarModule,
    InputSwitchModule,
    PanelModule,
    MultiSelectModule,
    TooltipModule,
    GbUtilsModule
  ],
  exports: [
    RouterModule,
  ],
  declarations: [
    GbSelectProjectComponent
  ]
})
export class GbSelectProjectModule {
}
