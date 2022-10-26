/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GbExploreComponent } from './gb-explore.component';
import { routing } from './gb-explore.routing';
import { AccordionModule, DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng';
import { OverlayPanelModule } from 'primeng';
import { RouterModule } from '@angular/router';
import { GbCombinationConstraintComponent } from './constraint-components/gb-combination-constraint/gb-combination-constraint.component';
import { GbConstraintComponent } from './constraint-components/gb-constraint/gb-constraint.component';

import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng';
import { CheckboxModule } from 'primeng';
import { CalendarModule } from 'primeng';
import { PanelModule } from 'primeng';
import { InputSwitchModule } from 'primeng';
import { DynamicDialogModule } from 'primeng';
import { MultiSelectModule } from 'primeng';
import { GbSelectionModule } from './gb-selection-component/gb-selection.module';

import { TooltipModule } from 'primeng/tooltip';
import { GbTemporalSequenceComponent } from './constraint-components/gb-sequential-constraint/gb-temporal-sequence/gb-temporal-sequence.component';
import { GbCompositeConstraintComponent } from './constraint-components/gb-composite-constraint/gb-composite-constraint.component';
import { GbSequentialConstraintComponent } from './constraint-components/gb-sequential-constraint/gb-sequential-constraint.component';
import { GbUtilsModule } from '../gb-utils-module/gb-utils.module';
import { GbAnalytesDropzonesComponent } from './analytes-dropzones/gb-analytes-dropzones.component';


@NgModule({
  imports: [
    CommonModule,
    AccordionModule,
    OverlayPanelModule,
    routing,
    FormsModule,
    InputSwitchModule,
    DynamicDialogModule,
    AutoCompleteModule,
    CheckboxModule,
    CalendarModule,
    InputSwitchModule,
    PanelModule,
    MultiSelectModule,
    GbSelectionModule,
    TooltipModule,
    GbUtilsModule
  ],
  exports: [
    RouterModule,
  ],
  declarations: [
    GbExploreComponent,
    GbAnalytesDropzonesComponent
  ],
  providers: [
    DialogService,
    DynamicDialogConfig,
    DynamicDialogRef,
  ],
  entryComponents: [
    GbConstraintComponent,
    GbCombinationConstraintComponent,
    GbTemporalSequenceComponent,
    GbCompositeConstraintComponent,
    GbSequentialConstraintComponent
  ]
})
export class GbExploreModule {
}
