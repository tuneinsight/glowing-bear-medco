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

  private _isRefreshingNodes = false;

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

  get isRefreshingNodes() {
    return this._isRefreshingNodes;
  }

  set isRefreshingNodes(value: boolean) {
    this._isRefreshingNodes = value;
  }

  getTooltipMessage(nodeName: string) {
    const node = this.getNodes.find((e) => e.name === nodeName);

    let titleStr = `${nodeName} (${node.url} | ${node.organization.country})`;

    const networkStatus = this.medcoNetworkService.networkStatus?.find((e) => e.from === nodeName);

    if (networkStatus?.statuses) {
      titleStr += ` is connected to:\n  \
              ${networkStatus.statuses.reduce((result, status) => `${result}\n${status.node}: ${status.status}`, '')}
      `;
    } else {
      titleStr += ' seems to be down.'
    }
    return titleStr;
  }

  refreshNodes() {
    this.isRefreshingNodes = true;
    this.medcoNetworkService.getNetworkStatus().then(() => {
      this.isRefreshingNodes = false;
    });
  }


  onChangeNode(e) {
    this.medcoNetworkService.setNodeChecked(e.srcElement.name, e.srcElement.checked);
  }

  isNodeUp(nodeName: string) {
    const thisNodeStatus = this.medcoNetworkService.networkStatus?.find((e) => e.from === nodeName)
    if (!thisNodeStatus) {
      return false
    }
    const statuses = thisNodeStatus.statuses
    return !!statuses;
  }

  isNodeInProject(nodeName: string) {
    return !!this.medcoNetworkService.projectNodes.find((projectNodeName) => projectNodeName === nodeName);
  }

  get isBiorefMode(): boolean {
    return this.config.getConfig('isBiorefMode');
  }
}
