/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2018 - 2019 EPFL LDS (LCA1) EPFL
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable } from '@angular/core';
import { AppConfig } from '../../../config/app.config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'
import { TreeNode } from '../../../models/tree-models/tree-node';
import { TreeNodeType } from '../../../models/tree-models/tree-node-type';
import { ValueType } from '../../../models/constraint-models/value-type';
import { ApiEndpointService } from '../../api-endpoint.service';
import {ApiValueMetadata, DataType} from '../../../models/api-response-models/medco-node/api-value-metadata';
import {MessageHelper} from '../../../utilities/message-helper';
import { KeycloakService } from 'keycloak-angular';
import { TreeNodeService } from '../../tree-node.service';

@Injectable()
export class ExploreSearchService {

  /**
   * If the configuration key `medco-cothority-key-url` is present, the file will be fetched and the service enabled.
   * @param {AppConfig} config
   * @param http
   * @param medcoNetworkService
   * @param apiEndpointService
   * @param injector
   */
  constructor(private config: AppConfig,
    private apiEndpointService: ApiEndpointService,
    private keycloakService: KeycloakService,
    private treeNodeService: TreeNodeService
    ) { }

    private mapSearchResults(searchResp) {
      if (this.treeNodeService.isLoading && searchResp.error) {
        console.error(searchResp.error);
        alert(`Error while getting initial tree. \
      Maybe i2b2 service is not running? Please contact an administrator. You will now be logged out.`);
        this.keycloakService.logout();
      }
      return (searchResp.results.searchResult || []).map((treeNodeObj) => {
        let treeNode = new TreeNode();
        treeNode.path = treeNodeObj['path'];
        treeNode.appliedPath = treeNodeObj['appliedPath'];
        treeNode.name = treeNodeObj['name'];
        if (treeNodeObj['parent']) {
          treeNode.parent = this.mapSearchResults({ results: { searchResult: [treeNodeObj['parent']] } })[0];
          treeNode.parent.metadata = undefined;
        }
        treeNode.displayName = treeNodeObj['displayName'];
        treeNode.description = `${treeNodeObj['displayName']} (${treeNodeObj['code']})`;
        treeNode.conceptCode = treeNodeObj['code'];
        treeNode.metadata = treeNodeObj['metadata'];
        treeNode.comment = treeNodeObj['comment'];
        // leaf in the database is not a leaf in the tree, as modifiers
        // are displayed as children
        treeNode.leaf = false;
        treeNode.encryptionDescriptor = treeNodeObj['medcoEncryption'];

        treeNode.nodeType = this.nodeType(treeNodeObj['type'] as string);
        treeNode.type = this.type(treeNode.nodeType, treeNode.metadata);
        treeNode.depth = treeNode.path.split('/').length - 2;
        treeNode.children = [];
        treeNode.childrenAttached = false;

        return treeNode;
      });
    }

    private exploreSearch(searchString: string, limit: string): Observable<TreeNode[]> {
      const haveRightsForPatientList = !!this.keycloakService.getUserRoles().find((role) => role === 'patient_list');

      return this.apiEndpointService.postCall(
        `projects/${this.config.projectId}/datasource/query`,
        {
          operation: 'searchOntology',
          aggregationType:  'per_node',
          outputDataObjectsNames: ['searchConcept'],
          parameters: {
            searchString,
            limit
          }
        }
      ).pipe(
        map(this.mapSearchResults.bind(this))
      );
    }
    /**
     * Perform search concept children in ontology.
     *
     * @param {string} root - the path to the specific tree node, must include the first slash
     *
     * @returns {Observable<Object>}
     */
    exploreSearchTerm(searchString: string, limit: string = '50'): Observable<TreeNode[]> {
      return this.exploreSearch(searchString, limit);
    }

  private exploreSearchConcept(operation: string, root: string, unlimitedChildren?: boolean): Observable<TreeNode[]> {

    return this.apiEndpointService.postCall(
      `projects/${this.config.projectId}/datasource/query`,
      {
        operation: 'searchConcept',
        aggregationType: 'per_node',
        outputDataObjectsNames: ['patientList', 'count'],
        parameters: {
          operation: operation,
          path: root,
          limit: unlimitedChildren ? '0' : undefined
        }
      }
    ).pipe(
      map((searchConceptResponse) => {
        if (searchConceptResponse.status === 'error' && searchConceptResponse.error.indexOf('MAX_EXCEEDED') !== -1) {
          return { retry: true };
        } else {
          return this.mapSearchResults(searchConceptResponse);
        }
      })
    );
  }
  /**
   * Perform search concept children in ontology.
   *
   * @param {string} root - the path to the specific tree node, must include the first slash
   *
   * @returns {Observable<Object>}
   */
  exploreSearchConceptChildren(root: string, unlimitedChildren?: boolean): Observable<TreeNode[]> {
    return this.exploreSearchConcept('children', root, unlimitedChildren)
  }

  /**
   * Perform search concept info in ontology.
   *
   * @param {string} root - the path to the specific tree node, must include the first slash
   *
   * @returns {Observable<Object>}
   */
  exploreSearchConceptInfo(root: string, unlimitedChildren?: boolean): Observable<TreeNode[]> {
    return this.exploreSearchConcept('info', root, unlimitedChildren)
  }


  private exploreSearchModifier(
    operation: 'concept' | 'children' | 'info',
    path: string,
    appliedPath: string,
    appliedConcept: string,
    unlimitedChildren?: boolean): Observable<TreeNode[] | { retry: boolean }> {

    return this.apiEndpointService.postCall(
      `projects/${this.config.projectId}/datasource/query`,
      {
        operation: 'searchModifier',
        aggregationType: 'per_node',
        outputDataObjectsNames: ['patientList', 'count'],
        parameters: {
          operation: operation,
          path: path,
          appliedPath: appliedPath,
          appliedConcept: appliedConcept,
          limit: unlimitedChildren ? '0' : undefined
        }
      }
    ).pipe(
      map((searchModifierResponse) => {
        if (searchModifierResponse.status === 'error' && searchModifierResponse.error.indexOf('MAX_EXCEEDED') !== -1) {
          return { retry: true };
        } else {
          return this.mapSearchResults(searchModifierResponse);
        }
      })
    );
  }

  private nodeType(nodeTypeString: string): TreeNodeType {
    switch (nodeTypeString.toLowerCase()) {
      case 'concept':
        return TreeNodeType.CONCEPT;

      case 'concept_folder':
        return TreeNodeType.CONCEPT_FOLDER;

      case 'genomic_annotation':
        return TreeNodeType.GENOMIC_ANNOTATION;


      case 'modifier':
        return TreeNodeType.MODIFIER

      case 'modifier_folder':
        return TreeNodeType.MODIFIER_FOLDER;


      case 'modifier_container':
        return TreeNodeType.MODIFIER_CONTAINER;


      case 'concept_container':
        return TreeNodeType.CONCEPT_CONTAINER;

      default:
        return TreeNodeType.UNKNOWN;
    }
  }

  private type(nodeType: TreeNodeType, metadata: ApiValueMetadata): ValueType {
    if (nodeType === TreeNodeType.GENOMIC_ANNOTATION) {
      return null
    }
    if (metadata) {
      if (metadata.dataType) {
        if ((metadata.okToUseValues) && metadata.okToUseValues === 'Y') {
          switch (metadata.dataType) {
            case DataType.FLOAT:
            case DataType.INTEGER:
            case DataType.POS_FLOAT:
            case DataType.POS_INTEGER:
              return ValueType.NUMERICAL
            case DataType.ENUM:
              return ValueType.CATEGORICAL
            case DataType.STRING:
              return ValueType.TEXT
            default:
              MessageHelper.alert('warn', `In ontology tree, data type ${metadata.dataType} unknown`)
              return ValueType.SIMPLE
          }
        }
      }
    }
    return ValueType.SIMPLE
  }

  /**
   * Perform search modifier children in ontology.
   *
   * @param {string} root - the path to the specific tree node, must include the first slash
   *
   * @returns {Observable<Object>}
   */
  exploreSearchModifierChildren(root: string,
    appliedPath: string,
    appliedConcept: string,
    unlimitedChildren?: boolean): Observable<TreeNode[] | { retry: boolean }> {
    return this.exploreSearchModifier('children', root, appliedPath, appliedConcept, unlimitedChildren)
  }

  /**
   * Perform search modifier info in ontology.
   *
   * @param {string} root - the path to the specific tree node, must include the first slash
   *
   * @returns {Observable<Object>}
   */
  exploreSearchModifierInfo(root: string,
    appliedPath: string,
    appliedConcept: string,
    unlimitedChildren?: boolean): Observable<TreeNode[] | { retry: boolean }> {
    return this.exploreSearchModifier('info', root, appliedPath, appliedConcept, unlimitedChildren)
  }
}
