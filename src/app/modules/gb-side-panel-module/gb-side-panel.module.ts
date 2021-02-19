/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AccordionModule, AutoCompleteModule, ButtonModule, ConfirmationService, ConfirmDialogModule, DragDropModule, InputTextModule, OverlayPanelModule, PanelModule, RadioButtonModule, TabMenuModule, ToggleButtonModule, TooltipModule, TreeDragDropService, TreeModule } from 'primeng';
import { ExploreCohortsService } from '../../services/api/medco-node/explore-cohorts.service';
import { SavedCohortsPatientListService } from '../../services/saved-cohorts-patient-list.service';
import { SurvivalService } from '../../services/survival-analysis.service';
import { PathDisplayer } from '../gb-utils-module/gb-utils.component';
import { GbUtilsModule } from '../gb-utils-module/gb-utils.module';
import { CombinationConstraintSummaryComponent, SimpleConceptSummaryComponent } from './accordion-components/gb-cohort-definition/constraintVisitor/htmlExportVisitor';
import { GbCohortDefinitionComponent } from './accordion-components/gb-cohort-definition/gb-cohort-definition.component';
import { GbCohortsComponent } from './accordion-components/gb-cohorts/gb-cohorts.component';
import { GbSummaryComponent } from './accordion-components/gb-summary/gb-summary.component';
import { GbTreeNodesComponent } from './accordion-components/gb-tree-nodes/gb-tree-nodes.component';
import { GbSidePanelComponent } from './gb-side-panel.component';


@NgModule({
  imports: [
    CommonModule,
    AccordionModule,
    TreeModule,
    OverlayPanelModule,
    DragDropModule,
    FormsModule,
    AutoCompleteModule,
    PanelModule,
    ButtonModule,
    ToggleButtonModule,
    InputTextModule,
    TooltipModule,
    ConfirmDialogModule,
    RadioButtonModule,
    TabMenuModule,
    BrowserModule,
    GbUtilsModule,
  ],
  declarations: [
    GbSidePanelComponent,
    GbTreeNodesComponent,
    GbSummaryComponent,
    GbCohortsComponent,
    GbCohortDefinitionComponent,
    SimpleConceptSummaryComponent,
    CombinationConstraintSummaryComponent,
  ],
  providers: [TreeDragDropService, ConfirmationService, SurvivalService, ExploreCohortsService, SavedCohortsPatientListService],
  exports: [GbSidePanelComponent]
})
export class GbSidePanelModule {
}
