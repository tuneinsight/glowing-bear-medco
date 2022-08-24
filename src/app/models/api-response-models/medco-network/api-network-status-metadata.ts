type NodeStatus = {
  node: string;
  status: "ok" | "nok"
};

type FromNodeReturn = {
  from: string;
  statuses: NodeStatus[];
};

export type ApiNetworkStatusMetadata = FromNodeReturn[];
