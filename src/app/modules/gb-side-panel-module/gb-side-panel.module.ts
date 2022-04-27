/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { TabMenuModule } from 'primeng';
import { GbSidePanelComponent } from './gb-side-panel.component';
import { AccordionModule } from 'primeng';
import { TreeModule } from 'primeng';
import { GbTreeNodesComponent } from './accordion-components/gb-tree-nodes/gb-tree-nodes.component';
import { ConfirmationService, TreeDragDropService } from 'primeng';
import { OverlayPanelModule } from 'primeng';
import { DragDropModule } from 'primeng';
import { FormsModule } from '@angular/forms';
import { GbSummaryComponent } from './accordion-components/gb-summary/gb-summary.component';
import { AutoCompleteModule } from 'primeng';
import { PanelModule } from 'primeng';
import { ButtonModule } from 'primeng';
import { InputTextModule } from 'primeng';
import { TooltipModule } from 'primeng';
import { ConfirmDialogModule } from 'primeng';
import { RadioButtonModule } from 'primeng';
import { GbCohortsComponent } from './accordion-components/gb-cohorts/gb-cohorts.component';
import { GbUtilsModule } from '../gb-utils-module/gb-utils.module';

import { ToggleButtonModule } from 'primeng'
import {SurvivalService} from '../../services/survival-analysis.service';
import {SavedCohortsPatientListService} from '../../services/saved-cohorts-patient-list.service';
import {ExploreCohortsService} from '../../services/api/medco-node/explore-cohorts.service';
import { GbCohortDefinitionComponent } from './accordion-components/gb-cohort-definition/gb-cohort-definition.component';
import { CombinationConstraintSummaryComponent, SimpleConceptSummaryComponent } from './accordion-components/gb-cohort-definition/constraintVisitor/htmlExportVisitor';

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
    GbUtilsModule
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
