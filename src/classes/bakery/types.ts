export type NetworkOutboundState = {
  available: boolean;
  running?: boolean;
  error?: string;
};
export type NetworkInboundState = {
  available: boolean;
  running?: boolean;
  error?: string;
  address?: string;
};
export type NetworkState = {
  inbound: NetworkInboundState;
  outbound: NetworkInboundState;
};
export type NetworkStateResult = {
  tor: NetworkState;
  hyper: NetworkState;
  i2p: NetworkState;
};

export type LogEntry = {
  id: string;
  service: string;
  timestamp: number;
  message: string;
};
