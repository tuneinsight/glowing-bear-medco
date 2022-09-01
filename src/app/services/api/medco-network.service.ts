/**
 * Copyright 2019  LDS EPFL
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Injectable, Injector} from '@angular/core';
import {AppConfig} from '../../config/app.config';
import {Observable} from 'rxjs';
import {ApiEndpointService} from '../api-endpoint.service';
import {ApiNetworkMetadata} from '../../models/api-response-models/medco-network/api-network-metadata';
import {ApiNetworkStatusMetadata} from '../../models/api-response-models/medco-network/api-network-status-metadata';
import {ApiNodeMetadata} from '../../models/api-response-models/medco-network/api-node-metadata';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class MedcoNetworkService {

  /**
   * Contains the network/cothority public key.
   */
  private _networkPubKey: string;

  /**
   * Contains the list of nodes and their metadata.
   */
  private _nodes: ApiNodeMetadata[];
  private _networkStatus: ApiNetworkStatusMetadata;
  private _projectNodes: string[] = [];

  private config: AppConfig;
  private apiEndpointService: ApiEndpointService;

  constructor(private injector: Injector,
              private keycloakService: KeycloakService) { }

  load(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.config = this.injector.get(AppConfig);
      this.apiEndpointService = this.injector.get(ApiEndpointService);

      this.getNetwork().subscribe((metadata) => {
        this._networkPubKey = metadata['public-key'];
        this._nodes = metadata.nodes.sort(({ current }) => +current);

        console.log(`Loaded nodes: ${metadata.nodes.map((a) => a.name).join(', ')}`);
        resolve();
      }, (err) => {
        console.error(err);
        let errMessage = 'Undefined error when checking network.';
        if (err.status === 0) {
          errMessage = `Your node (${this.config.getConfig('medco-node-url')}) is not reachable.`;
        } else if (err.status === 403) {
          errMessage = `Unauthorized access to your node (${this.config.getConfig('medco-node-url')}).`;
        }
        alert(`${errMessage} Please contact an administrator. You will now be logged out.`);
        this.keycloakService.logout();
        reject(err);
      });
    });
  }

  // ------------------- getters/setter ----------------------
  get networkPubKey(): string {
    return this._networkPubKey;
  }

  get nodes(): ApiNodeMetadata[] {
    return this._nodes;
  }

  get networkStatus() {
    return this._networkStatus;
  }

  get projectNodes() {
    return this._projectNodes;
  }

  set projectNodes(value: string[]) {
    this._projectNodes = value;
  }

  //  ------------------- others ----------------------

  public setNodeChecked(name: string, isChecked: boolean) {
    this._nodes = this._nodes.map((node) => ({
      ...node,
      ...(node.name === name ? {
        isChecked
      } : {})
    }));
  }

  /**
   * Returns the MedCo network metadata.
   * @returns {Observable<ApiNetworkMetadata[]>}
   */
  getNetwork(): Observable<ApiNetworkMetadata> {
    const urlPart = 'network';
    return this.apiEndpointService.getCall(urlPart, false, undefined, false);
  }

  /**
   * Sets the MedCo network status metadata.
   */
  getNetworkStatus() {
    return new Promise<void>((resolve, reject) => {
      const urlPart = `projects/${this.config.projectId}/network-status`;
      this.apiEndpointService.getCall(urlPart, false, undefined, false).subscribe((metadata) => {
        this._networkStatus = metadata;
        resolve();
      });
    });
  }
}
