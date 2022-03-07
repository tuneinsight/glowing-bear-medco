import {ApiNodeMetadata} from './api-node-metadata';

export class ApiNetworkMetadata {
  'public-key': string | null;
  nodes: ApiNodeMetadata[];
}
