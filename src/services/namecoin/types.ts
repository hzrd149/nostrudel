/** Namecoin NIP-05 identity resolution types */

/** Result of resolving a Namecoin name's Nostr data */
export interface NamecoinNostrResult {
  pubkey: string;
  relays?: string[];
}

/** Parsed Namecoin identifier */
export interface ParsedNamecoinIdentifier {
  /** The raw Namecoin name, e.g. "d/example" or "id/alice" */
  namecoinName: string;
  /** Namespace: "d" (domain) or "id" (identity) */
  namespace: "d" | "id";
  /** The name within the namespace, e.g. "example" */
  name: string;
  /** Local part for domain namespace (from user@domain.bit), undefined for root */
  localPart?: string;
  /** Original NIP-05 style address if applicable */
  originalAddress?: string;
}

/** Settings for the Namecoin resolver */
export interface NamecoinSettings {
  /** URL of the ElectrumX HTTP proxy */
  proxyUrl: string;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTtl?: number;
}
