import type { WebrtcOpenRequest } from "@napplet/core";

export type WebrtcDescription = { type: "offer" | "answer"; sdp: string };
/** Emit peer discovery before descriptions; connectionId changes when that peer restarts. */
export type WebrtcSignal =
  | { type: "closed"; reason: string }
  | { type: "peer"; pubkey: string; connectionId: string; initiator: boolean }
  | { type: "description"; pubkey: string; connectionId: string; description: WebrtcDescription };

export type WebrtcSignalingSession = {
  self: string;
  /** Identifies equivalent scopes for duplicate-session detection. */
  scopeKey: string;
  /** Starts discovery after the napplet has received its session id. */
  start(receive: (signal: WebrtcSignal) => void): void;
  sendDescription(pubkey: string, connectionId: string, description: WebrtcDescription): Promise<void>;
  forgetPeer(pubkey: string, connectionId: string): void;
  close(): void;
};

export type WebrtcSignaling = {
  /** Allocates a session without publishing or subscribing yet. */
  open(request: WebrtcOpenRequest & { channel: string }): Promise<WebrtcSignalingSession>;
  close(): void;
};
