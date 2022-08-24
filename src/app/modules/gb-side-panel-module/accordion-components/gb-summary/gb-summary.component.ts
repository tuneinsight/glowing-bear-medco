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

@Component({
  selector: 'gb-summary',
  templateUrl: './gb-summary.component.html',
  styleUrls: ['./gb-summary.component.css']
})
export class GbSummaryComponent {

  constructor(private queryService: QueryService,
              private medcoNetworkService: MedcoNetworkService) {
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

  getTooltipMessage(nodeName: string) {
    const node = this.getNodes.find((e) => e.name === nodeName);

    if (!node.isUp) {
      return `This node (${node.name} | ${node.url} | ${node.organization.country}) seems to be down`
    }

    const networkStatus = this.medcoNetworkService.networkStatus?.find((e) => e.from === nodeName);
    let titleStr = `${nodeName} (${node.url} | ${node.organization.country})`;
    
    if (networkStatus) {
      titleStr += ` is connected to:\n  \
              ${networkStatus.statuses.reduce((result, status) => `${result}\n${status.node}: ${status.status}`, "")}
      `;
    }
    return titleStr;
  }

  onChangeNode(e) {
    this.medcoNetworkService.setNodeChecked(e.srcElement.name, e.srcElement.checked);
  }
}
