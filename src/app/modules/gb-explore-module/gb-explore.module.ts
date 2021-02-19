/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccordionModule, AutoCompleteModule, CalendarModule, CheckboxModule, InputSwitchModule, MultiSelectModule, OverlayPanelModule, PanelModule } from 'primeng';
import { TooltipModule } from 'primeng/tooltip';
import { GbUtilsModule } from '../gb-utils-module/gb-utils.module';
import { GbAnalytesDropzones } from './analytes-dropzones/gb-analytes-dropzones.component';
import { GbCombinationConstraintComponent } from './constraint-components/gb-combination-constraint/gb-combination-constraint.component';
import { GbConstraintComponent } from './constraint-components/gb-constraint/gb-constraint.component';
import { GbExploreComponent } from './gb-explore.component';
import { routing } from './gb-explore.routing';
import { GbSelectionModule } from './gb-selection-component/gb-selection.module';




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
    GbSelectionModule,
    TooltipModule,
    GbUtilsModule,
  ],
  exports: [
    RouterModule,
  ],
  declarations: [
    GbExploreComponent,
    GbAnalytesDropzones
  ],
  entryComponents: [
    GbConstraintComponent,
    GbCombinationConstraintComponent
  ]
})
export class GbExploreModule {
}
