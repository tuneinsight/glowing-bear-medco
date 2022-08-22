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
import { NavbarService } from 'src/app/services/navbar.service';
import { TreeNodeService } from 'src/app/services/tree-node.service';

type Project = {
  name: string;
  uniqueId: string;
}

@Component({
  selector: 'gb-select-project',
  templateUrl: './gb-select-project.component.html',
  styleUrls: ['./gb-select-project.component.css']
})
export class GbSelectProjectComponent {
  private projectList: Project[] = [];
  private selectedProjectIndex = 0;

  constructor(
    private config: AppConfig,
    private apiEndpointService: ApiEndpointService,
    private navbarService: NavbarService,
    private treeNodeService: TreeNodeService) {

  }

  async ngOnInit() {
    const projects = await this.apiEndpointService.getCall("/projects").toPromise();
    const i2b2Projects = projects.filter((project) => project.name.startsWith("i2b2")); 
    this.projectList = i2b2Projects;
  }
  
  onChangeProject(index) {
    this.selectedProjectIndex = index;
  }

  onValidateProject() {
    this.config.projectId = this.projectList[this.selectedProjectIndex].uniqueId;

    this.navbarService.navigateToExploreTab();
    this.treeNodeService.exploreTreeNode();
  }

  public getProjectList() {
    return this.projectList;
  }
}
