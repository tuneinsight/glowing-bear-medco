/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020  LDS EPFL
 * Copyright 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component } from '@angular/core';
import { AppConfig } from 'src/app/config/app.config';
import { ApiEndpointService } from 'src/app/services/api-endpoint.service';
import { MedcoNetworkService } from 'src/app/services/api/medco-network.service';
import { CohortService } from 'src/app/services/cohort.service';
import { NavbarService } from 'src/app/services/navbar.service';
import { QueryService } from 'src/app/services/query.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';

interface Project {
  name: string;
  dataSourceId: string;
  uniqueId: string;
  participants: {
    node: {
      name: string;
    }
  }[];
}

@Component({
  selector: 'gb-select-project',
  templateUrl: './gb-select-project.component.html',
  styleUrls: ['./gb-select-project.component.css']
})
export class GbSelectProjectComponent {
  private projectList: Project[] = [];
  private _selectedProjectIndex = -1;
  //private _setIntervalTimeout = null;

  constructor(
    private config: AppConfig,
    private apiEndpointService: ApiEndpointService,
    private navbarService: NavbarService,
    private cohortService: CohortService,
    private treeNodeService: TreeNodeService,
    private medcoNetworkService: MedcoNetworkService,
    private queryService: QueryService) {

  }

  async ngOnInit() {
    const projects = await this.apiEndpointService.getCall('projects').toPromise();

    const getIndexOfProject = (projectName: string) => {
      return projects.findIndex(project => project.name === projectName);
    };

    let tmpProjects = [];
    for (let index = 0; index < projects.length; index++) {
      const project = projects[index];

      if (!project.dataSourceId) {
        return false;
      }
      const datasource = await this.apiEndpointService.getCall(`datasources/${project.dataSourceId}`).toPromise();
      if (datasource.type === 'i2b2') {
        tmpProjects.push(project);
      }
    }

    this.projectList = tmpProjects.sort((a, b) => getIndexOfProject(a.name) - getIndexOfProject(b.name));

    if (this.navbarService.items[1].disabled) {
      this.onChangeProject(0);
    } else if (this.config.projectId) {
      this._selectedProjectIndex = this.projectList.findIndex((p) => p.uniqueId === this.config.projectId);
    }
  }

  onChangeProject(index) {
    this._selectedProjectIndex = index;
    const selectedProject = this.projectList[this._selectedProjectIndex];
    this.config.projectId = selectedProject.uniqueId;
    this.config.projectName = selectedProject.name;
    this.medcoNetworkService.projectNodes = selectedProject.participants.map((participant) => participant.node.name);
    this.cohortService.clearAll();
    this.queryService.clearAll();
    this.treeNodeService.exploreTreeNode();
    this.navbarService.init();
    this.navbarService.navigateToExploreTab();

    //if (this._setIntervalTimeout) {
    //  clearInterval(this._setIntervalTimeout);
    //}
    this.medcoNetworkService.getNetworkStatus();
    //this._setIntervalTimeout = setInterval(() => {
    //  this.medcoNetworkService.getNetworkStatus();
    //}, 1000 * 60);
  }

  public getProjectList() {
    return this.projectList;
  }

  get selectedProjectIndex() {
    return this._selectedProjectIndex;
  }
}
