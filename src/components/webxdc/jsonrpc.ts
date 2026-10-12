/** A JSON-RPC 2.0 envelope posted by the webxdc iframe; id, method and params are untrusted. */
export type WebxdcMessage = { jsonrpc: "2.0"; method?: unknown; id?: unknown; params?: unknown };

/** Narrows iframe `event.data`; mirrors the shell's previous truthiness check so it rejects nothing that check accepted. */
export function isWebxdcMessage(data: unknown): data is WebxdcMessage {
  return typeof data === "object" && data !== null && "jsonrpc" in data && data.jsonrpc === "2.0";
}
