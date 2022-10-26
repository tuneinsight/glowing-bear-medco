/**
 * Copyright 2020-2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {ApiQueryDefinition} from '../../api-request-models/medco-node/api-query-definition';


export class ApiCohortResponse {
  id: string
  status: string
  results: {
    cohorts: {
      name: string;
      CreationDate: string;
      exploreQuery: {
        creationDate: string;
        definition: ApiQueryDefinition;
        id: string;
        outputDataObjectsSharedIDs: {
          [k in string]: string;
        }
        status: string;
      };
    }[]
  };
}
