import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { generateSecretKey } from "nostr-tools";
import { type SerializedAccount } from "applesauce-accounts";

import { type RelayAuthMode } from "./authentication-signer";
import { PreferenceSubject } from "../classes/preference-subject";
import { DEFAULT_LOOKUP_RELAYS, DEFAULT_SIGNAL_RELAYS } from "../const";

// Accounts
const accounts = await PreferenceSubject.array<SerializedAccount<any, any>>("accounts", []);
const activeAccount = await PreferenceSubject.stringNullable("active-account", null);

// Relays
const readRelays = await PreferenceSubject.array<string>("read-relays", []);
const writeRelays = await PreferenceSubject.array<string>("write-relays", []);
const lookupRelays = await PreferenceSubject.array<string>("lookup-relays", DEFAULT_LOOKUP_RELAYS);

// Event cache
const idbMaxEvents = await PreferenceSubject.number("nostr-idb-max-events", 10_000);
const wasmPersistForDays = await PreferenceSubject.numberNullable("wasm-relay-oldest-event", 365);

// Display
const hideZapBubbles = await PreferenceSubject.boolean("hide-zap-bubbles", false);
const hideUsernames = await PreferenceSubject.boolean("hide-usernames", false);

// WebRTC Relay
const webRtcLocalIdentity = await PreferenceSubject.create<Uint8Array>("nostr-webrtc-identity", generateSecretKey(), {
  decode: (raw) => hexToBytes(raw),
  encode: (key) => bytesToHex(key),
  saveDefault: true,
});
const webRtcSignalingRelays = await PreferenceSubject.array<string>(
  "nostr-webrtc-signaling-relays",
  DEFAULT_SIGNAL_RELAYS,
);
const webRtcRecentConnections = await PreferenceSubject.array<string>("nostr-webrtc-recent-connections", []);

// Posting
const addClientTag = await PreferenceSubject.boolean("add-client-tag", false);

// Performance
const verifyEventMethod = await PreferenceSubject.string("verify-event-method", "wasm"); // wasm, internal, none

// Privacy
const enableDebugApi = await PreferenceSubject.boolean("debug-api", false);
const alwaysAuthUpload = await PreferenceSubject.boolean("always-auth-upload", true);

// Relay Authentication
const defaultAuthenticationMode = await PreferenceSubject.create<RelayAuthMode>("default-authentication-mode", "ask");
const proactivelyAuthenticate = await PreferenceSubject.boolean("proactively-authenticate", false);
const relayAuthenticationMode = await PreferenceSubject.array<{ relay: string; mode: RelayAuthMode }>(
  "relay-authentication-mode",
  [],
);

// Social Graph
const updateSocialGraphDistance = await PreferenceSubject.number("update-social-graph-distance", 2);
const updateSocialGraphInterval = await PreferenceSubject.number("update-social-graph-interval", 1000 * 60 * 60 * 24); // 1 day
const lastUpdatedSocialGraph = await PreferenceSubject.number("last-updated-social-graph", 0);

// Cache Relay
const eventCache = await PreferenceSubject.stringNullable("event-cache", null);

// Content Policies
const hideEventsOutsideSocialGraph = await PreferenceSubject.numberNullable("hide-events-outside-social-graph", null);
const blurMediaOutsideSocialGraph = await PreferenceSubject.numberNullable("blur-media-outside-social-graph", 3);
const hideEmbedsOutsideSocialGraph = await PreferenceSubject.numberNullable("hide-embeds-outside-social-graph", 4);

// Decryption cache
const encryptionSalt = await PreferenceSubject.create<Uint8Array>(
  "encryption-salt",
  crypto.getRandomValues(new Uint8Array(48)),
  {
    decode: (raw) => hexToBytes(raw),
    encode: (key) => bytesToHex(key),
    saveDefault: true,
  },
);
const encryptDecryptionCache = await PreferenceSubject.boolean("encrypt-decryption-cache", true);

// Direct messages
const enableDecryptionCache = await PreferenceSubject.boolean("enable-decryption-cache", true);
const autoDecryptMessages = await PreferenceSubject.boolean("auto-decrypt-messages", true);
const defaultMessageExpiration = await PreferenceSubject.numberNullable("default-message-expiration", null);

const localSettings = {
  // Accounts
  accounts,
  activeAccount,

  // Relays
  readRelays,
  writeRelays,
  lookupRelays,

  // Event cache
  idbMaxEvents,
  wasmPersistForDays,

  // Display
  hideZapBubbles,
  hideUsernames,

  webRtcLocalIdentity,
  webRtcSignalingRelays,
  webRtcRecentConnections,
  addClientTag,
  verifyEventMethod,
  defaultAuthenticationMode,
  proactivelyAuthenticate,
  relayAuthenticationMode,
  enableDebugApi,
  eventCache,
  alwaysAuthUpload,

  // Social Graph
  updateSocialGraphDistance,
  updateSocialGraphInterval,
  lastUpdatedSocialGraph,

  hideEventsOutsideSocialGraph,
  blurMediaOutsideSocialGraph,
  hideEmbedsOutsideSocialGraph,

  // Decryption cache
  encryptionSalt,
  encryptDecryptionCache,

  // Direct messages
  autoDecryptMessages,
  enableDecryptionCache,
  defaultMessageExpiration,
} satisfies Record<string, PreferenceSubject<any>>;

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
  console.log("Migrated", cleanup.length, "settings from local storage");
}

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.localSettings = localSettings;
}

export default localSettings;
