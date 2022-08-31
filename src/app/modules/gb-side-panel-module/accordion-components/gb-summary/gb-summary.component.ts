/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Component} from '@angular/core';
import { QueryService } from '../../../../services/query.service';
import { FormatHelper } from '../../../../utilities/format-helper';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {ExploreQueryResult} from '../../../../models/query-models/explore-query-result';
import { MedcoNetworkService } from 'src/app/services/api/medco-network.service';
import { AppConfig } from 'src/app/config/app.config';

@Component({
  selector: 'gb-summary',
  templateUrl: './gb-summary.component.html',
  styleUrls: ['./gb-summary.component.css']
})
export class GbSummaryComponent {

  constructor(private queryService: QueryService,
              private medcoNetworkService: MedcoNetworkService,
              private config: AppConfig) {
  }

  get projectName() {
    return this.config.projectName;
  }


  get globalCount(): Observable<string> {
    return this.queryService.queryResults.pipe(map((queryResults) =>
      queryResults ? FormatHelper.formatCountNumber(queryResults.globalCount) : '0'
    ));
  }

  get hasPerSiteCounts(): boolean {
    return this.queryService.queryType?.hasPerSiteCounts || false;
  }

  get queryResults(): Observable<ExploreQueryResult> {
    return this.queryService.queryResults;
  }

  get getNodes() {
    return this.medcoNetworkService.nodes;
  }

  isNodeNotInProject(nodeName: string) {
    return !this.medcoNetworkService.projectNodes.find((projectNodeName) => projectNodeName === nodeName);
  }
}
