/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {BrowserModule} from '@angular/platform-browser';
import {NgModule, APP_INITIALIZER} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {routing} from './app.routing';
import {AppComponent} from './app.component';

import {TreeNodeService} from './services/tree-node.service';
import {AppConfig} from './config/app.config';
import {MedcoNetworkService} from './services/api/medco-network.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ConstraintService} from './services/constraint.service';
import {GbSidePanelModule} from './modules/gb-side-panel-module/gb-side-panel.module';
import {GbNavBarModule} from './modules/gb-navbar-module/gb-navbar.module';
import {QueryService} from './services/query.service';
import {NavbarService} from './services/navbar.service';
import {OntologyNavbarService} from './services/ontology-navbar.service';
import {TermSearchService} from './services/term-search.service';
import {DatePipe} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {AuthenticationService} from './services/authentication.service';
import {GbMainModule} from './modules/gb-main-module/gb-main.module';
import {ApiEndpointService} from './services/api-endpoint.service';
import {ExploreQueryService} from './services/api/medco-node/explore-query.service';
import {ExploreSearchService} from './services/api/medco-node/explore-search.service';
import {GenomicAnnotationsService} from './services/api/genomic-annotations.service';
import {CryptoService} from './services/crypto.service';
import {GbExploreModule} from './modules/gb-explore-module/gb-explore.module';
import {GbExploreResultsModule} from './modules/gb-explore-results-module/gb-explore-results.module';
import {ConstraintMappingService} from './services/constraint-mapping.service';
import {KeycloakAngularModule, KeycloakService} from 'keycloak-angular';
import {ExploreStatisticsService} from './services/explore-statistics.service';
import {GbAnalysisModule} from './modules/gb-analysis-module/gb-analysis.module';
import {GbSurvivalResultsModule} from './modules/gb-survival-results-module/gb-survival-results.module';
import {GbResultsModule} from './modules/gb-results-module/gb-results.module';
import {ToastrModule} from 'ngx-toastr';
import {DeviceDetectorService} from 'ngx-device-detector';
import { GbUtilsModule } from './modules/gb-utils-module/gb-utils.module';

export function loadServices(config: AppConfig,
                             authService: AuthenticationService,
                             medcoNetworkService: MedcoNetworkService,
                             treeNodeService: TreeNodeService,
                             cryptoService: CryptoService) {

  const start = performance.now(); // to measure performance

  return () => config.load().then(
    () => authService.load().then(
      () => Promise.all([
        medcoNetworkService.load(),
        treeNodeService.load(),
      ])
        .then(() => cryptoService.load())
        .then( () => {
        const elapsed = Math.round(performance.now() - start) + 'ms';
        console.log('Application loaded in', elapsed);
      })
    )
  );
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    KeycloakAngularModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({timeOut: 20000, extendedTimeOut: 5000, positionClass: 'toast-bottom-right'}),
    routing,
    GbMainModule,
    GbExploreModule,
    GbExploreResultsModule,
    GbAnalysisModule,
    GbResultsModule,
    GbUtilsModule,
    GbSurvivalResultsModule,
    GbNavBarModule,
    GbSidePanelModule,
  ],
  providers: [
    ApiEndpointService,
    TreeNodeService,
    MedcoNetworkService,
    ExploreStatisticsService,
    ExploreQueryService,
    ExploreSearchService,
    GenomicAnnotationsService,
    CryptoService,
    ConstraintService,
    QueryService,
    NavbarService,
    OntologyNavbarService,
    TermSearchService,
    DatePipe,
    AppConfig,
    KeycloakService,
    AuthenticationService,
    ConstraintMappingService,
    DeviceDetectorService,
    {
      provide: APP_INITIALIZER,
      useFactory: loadServices,
      deps: [AppConfig, AuthenticationService, MedcoNetworkService, TreeNodeService, CryptoService],
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
