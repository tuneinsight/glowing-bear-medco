interface NodeStatus {
  node: string;
  status: 'ok' | 'nok'
}

interface FromNodeReturn {
  from: string;
  statuses: NodeStatus[];
}

export type ApiNetworkStatusMetadata = FromNodeReturn[];
