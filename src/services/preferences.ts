import { Preferences } from "@capacitor/preferences";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { type SerializedAccount } from "applesauce-accounts";
import { safeParse } from "applesauce-core/helpers";

import { PreferenceSubject } from "../classes/preference-subject";
import { DEFAULT_FALLBACK_RELAYS, DEFAULT_MAX_CONNECTIONS, DEFAULT_MAX_RELAYS_PER_USER } from "../const";
import { logger } from "../helpers/debug";
import { resolvePromises } from "../helpers/promise";
import { type RelayAuthMode } from "./authentication-signer";

/**
 * The persisted configuration for a Nostr Wallet Connect (NIP-47) wallet. WebLN and NIP-60 (Cashu) wallets
 * are auto-detected from `window.webln` and the active account, so only NWC wallets need to be stored.
 */
export type StoredNwcWallet = { id: string; name: string; uri: string };

// Start independent storage reads together rather than serializing native bridge calls.
const localSettings = (await resolvePromises({
  // Accounts
  accounts: PreferenceSubject.array<SerializedAccount<any, any>>("accounts", []),
  activeAccount: PreferenceSubject.stringNullable("active-account", null),

  // Wallets
  wallets: PreferenceSubject.array<StoredNwcWallet>("wallets", []),
  activeWallet: PreferenceSubject.stringNullable("active-wallet", null),
  /**
   * Whether the NIP-60 (Cashu) wallet is enabled. Defaults to true; when false the wallet is never loaded
   * for the active account (and excluded from the wallet list), regardless of whether one exists on relays.
   */
  enableNutWallet: PreferenceSubject.boolean("enable-nut-wallet", true),
  /**
   * Whether to automatically decrypt the NIP-60 wallet (and its tokens/history) as it loads. Defaults to
   * false so the user's signer is not spammed with decrypt requests on every load; unlocking is opt-in.
   */
  autoUnlockNutWallet: PreferenceSubject.boolean("auto-unlock-nut-wallet", false),
  /**
   * The NIP-60 wallet does not publish NIP-09 (kind 5) delete events when it spends tokens, so the old token
   * events accumulate on relays. This setting automatically cleans up those stale (deleted-but-still-present)
   * token events once this many have accumulated. Null disables automatic cleanup, leaving the user to clean
   * them up manually.
   */
  cleanupNutWalletThreshold: PreferenceSubject.numberNullable("cleanup-nut-wallet-threshold", null),

  // Relays
  fallbackRelays: PreferenceSubject.array<string>("fallback-relays", DEFAULT_FALLBACK_RELAYS),
  extraPublishRelays: PreferenceSubject.array<string>("extra-publish-relays", []),

  // Relay liveness
  /** Whether to track relay connection failures locally and skip relays that keep failing */
  localRelayLiveness: PreferenceSubject.boolean("local-relay-liveness", true),
  /** The pubkeys of the NIP-66 monitors whose reports are used to skip offline relays */
  relayLivenessMonitors: PreferenceSubject.array<string>("relay-liveness-monitors", []),

  // Event cache
  idbMaxEvents: PreferenceSubject.number("nostr-idb-max-events", 10_000),
  wasmPersistForDays: PreferenceSubject.numberNullable("wasm-relay-oldest-event", 365),

  // Display
  hideZapBubbles: PreferenceSubject.boolean("hide-zap-bubbles", false),
  hideUsernames: PreferenceSubject.boolean("hide-usernames", false),
  displayCurrency: PreferenceSubject.stringNullable("display-currency", null),
  exchangeRateRefreshInterval: PreferenceSubject.number("exchange-rate-refresh-interval", 1000 * 60 * 60),
  exchangeRateEndpoint: PreferenceSubject.string(
    "exchange-rate-endpoint",
    // aislop-ignore-next-line ai-slop/hardcoded-url -- default of the user-editable exchange-rate-endpoint preference, so it is already configurable; a const.ts constant would still trip the rule on its /api/ path
    "https://mempool.space/api/v1/prices",
  ),

  // Posting
  addClientTag: PreferenceSubject.boolean("add-client-tag", false),

  // Performance
  verifyEventMethod: PreferenceSubject.string("verify-event-method", "wasm"), // wasm, internal, none (wasm-strict is a legacy alias)

  optimisticVerification: PreferenceSubject.boolean("optimistic-verification", true),

  // Privacy
  enableDebugApi: PreferenceSubject.boolean("debug-api", false),
  alwaysAuthUpload: PreferenceSubject.boolean("always-auth-upload", true),

  // Relay Authentication
  defaultAuthenticationMode: PreferenceSubject.create<RelayAuthMode>("default-authentication-mode", "ask"),
  proactivelyAuthenticate: PreferenceSubject.boolean("proactively-authenticate", false),
  relayAuthenticationMode: PreferenceSubject.array<{ relay: string; mode: RelayAuthMode }>(
    "relay-authentication-mode",
    [],
  ),

  // Social Graph
  updateSocialGraphDistance: PreferenceSubject.number("update-social-graph-distance", 2),
  updateSocialGraphInterval: PreferenceSubject.number("update-social-graph-interval", 1000 * 60 * 60 * 24), // 1 day
  lastUpdatedSocialGraph: PreferenceSubject.number("last-updated-social-graph", 0),

  // Cache Relay
  eventCache: PreferenceSubject.stringNullable("event-cache", null),

  // Content Policies
  hideEventsOutsideSocialGraph: PreferenceSubject.numberNullable("hide-events-outside-social-graph", null),
  blurMediaOutsideSocialGraph: PreferenceSubject.numberNullable("blur-media-outside-social-graph", 3),
  hideEmbedsOutsideSocialGraph: PreferenceSubject.numberNullable("hide-embeds-outside-social-graph", 4),

  // Decryption cache
  encryptionSalt: PreferenceSubject.create<Uint8Array>("encryption-salt", crypto.getRandomValues(new Uint8Array(48)), {
    decode: (raw) => hexToBytes(raw),
    encode: (key) => bytesToHex(key),
    saveDefault: true,
  }),
  encryptDecryptionCache: PreferenceSubject.boolean("encrypt-decryption-cache", true),

  // Pending unlock
  /**
   * Whether to automatically unlock every registered pending-unlock category (hidden mutes, the decryption
   * cache, etc.) without requiring a click. Defaults to false — D-01 forbids silent signer calls by default,
   * so a fresh install performs no automatic unlock.
   */
  autoUnlockAll: PreferenceSubject.boolean("auto-unlock-all", false),
  /**
   * Per-category auto-unlock opt-ins, keyed by the pending-unlock category id. Used only when `autoUnlockAll`
   * is false. Keyed by category id (not a fixed enum) so the list grows as sources register (D-05) without
   * editing this file again.
   */
  autoUnlockCategories: PreferenceSubject.create<Record<string, boolean>>(
    "auto-unlock-categories",
    {},
    {
      decode: (raw) => {
        const value = safeParse<Record<string, boolean>>(raw);
        if (value && typeof value === "object") return value;
        else return {};
      },
      encode: (value) => JSON.stringify(value),
    },
  ),

  // Direct messages
  enableDecryptionCache: PreferenceSubject.boolean("enable-decryption-cache", true),
  autoDecryptMessages: PreferenceSubject.boolean("auto-decrypt-messages", true),
  defaultMessageExpiration: PreferenceSubject.numberNullable("default-message-expiration", null),

  // Relay Selection
  maxConnections: PreferenceSubject.number("max-connections", DEFAULT_MAX_CONNECTIONS),
  maxRelaysPerUser: PreferenceSubject.number("max-relays-per-user", DEFAULT_MAX_RELAYS_PER_USER),

  // Username Lookup
  usernameLookupProvider: PreferenceSubject.string("username-lookup-provider", "primal"),
  primalCacheUrl: PreferenceSubject.stringNullable("primal-cache-url", null),
  vertexRelayUrl: PreferenceSubject.stringNullable("vertex-relay-url", null),
  vertexSortMethod: PreferenceSubject.string("vertex-sort-method", "globalPagerank"),
})) satisfies Record<string, PreferenceSubject<any>>;

// Lookup relays are now stored in a kind 10086 list on nostr.
await Preferences.remove({ key: "lookup-relays" });

// Migrate legacy local storage settings
let cleanup: string[] = [];
for (const [key, value] of Object.entries(localStorage)) {
  if (Reflect.has(localSettings, key)) {
    Reflect.get(localSettings, key).next(value);
    cleanup.push(key);
  }
}
if (cleanup.length) {
  for (const key of cleanup) {
    localStorage.removeItem(key);
  }
  logger.extend("Preferences")("Migrated", cleanup.length, "settings from local storage");
}

if (import.meta.env.DEV) {
  Reflect.set(window, "localSettings", localSettings);
}

export default localSettings;
