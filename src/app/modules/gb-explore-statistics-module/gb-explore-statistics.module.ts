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
import { AccordionModule, OverlayPanelModule } from 'primeng';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelModule } from 'primeng/panel';
import { GbSelectionModule } from '../gb-explore-module/gb-selection-component/gb-selection.module';
import { GbExploreStatisticsComponent } from './gb-explore-statistics.component';
import { routing } from './gb-explore-statistics.routing';
import { HistogramChartComponent, LineChartComponent } from './panel-components/gb-explore-statistics-results/gb-chart.component';
import { GbExploreStatisticsResultsComponent, ReferenceIntervalHistogram, ReferenceIntervalLine } from './panel-components/gb-explore-statistics-results/gb-explore-statistics-results.component';


@NgModule({
  imports: [
    CommonModule,
    AccordionModule,
    OverlayPanelModule,
    routing,
    FormsModule,
    CheckboxModule,
    PanelModule,
    MultiSelectModule,
    GbSelectionModule
  ],
  exports: [
    RouterModule,

  ],
  declarations: [
    GbExploreStatisticsComponent,
    GbExploreStatisticsResultsComponent,
    HistogramChartComponent,
    LineChartComponent,
    ReferenceIntervalHistogram,
    ReferenceIntervalLine
  ],
  entryComponents: []
})

export class GbExploreStatisticsModule {
}
