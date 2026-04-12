/** Namecoin protocol constants */

/** Default ElectrumX servers for Namecoin */
export const DEFAULT_ELECTRUMX_SERVERS = [
  { host: "nmc2.bitcoins.sk", port: 57001 },
];

/** Namecoin names expire after this many blocks without renewal */
export const NAME_EXPIRE_DEPTH = 36000;

/** Default proxy URL — uses Vite dev middleware in development */
export const DEFAULT_PROXY_PATH = "/__namecoin";

/** Cache TTL in ms (5 minutes) */
export const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/** OP codes for Namecoin name scripts */
export const OP_NAME_UPDATE = 0x53;
export const OP_2DROP = 0x6d;
export const OP_DROP = 0x75;
export const OP_RETURN = 0x6a;
