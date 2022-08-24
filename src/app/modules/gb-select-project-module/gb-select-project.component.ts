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
import { NavbarService } from 'src/app/services/navbar.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';

type Project = {
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

  constructor(
    private config: AppConfig,
    private apiEndpointService: ApiEndpointService,
    private navbarService: NavbarService,
    private treeNodeService: TreeNodeService,
    private medcoNetworkService: MedcoNetworkService) {

  }

  async ngOnInit() {
    const projects = await this.apiEndpointService.getCall("projects").toPromise();
    projects.forEach(async (project) => {
      if (!project.dataSourceId) {
        return false;
      }
      const datasource = await this.apiEndpointService.getCall(`datasources/${project.dataSourceId}`).toPromise();
      if (datasource.type === 'i2b2') {
        this.projectList.push(project);
      }
    })
  }
  
  onChangeProject(index) {
    this._selectedProjectIndex = index;
    const selectedProject = this.projectList[this._selectedProjectIndex];
    this.config.projectId = selectedProject.uniqueId;
    this.medcoNetworkService.projectNodes = selectedProject.participants.map((participant) => participant.node.name);
    this.treeNodeService.exploreTreeNode();
    this.navbarService.navigateToExploreTab();
  }

  public getProjectList() {
    return this.projectList;
  }

  get selectedProjectIndex() {
    return this._selectedProjectIndex;
  }
}
