import { generateSecretKey } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import { type RelayAuthMode } from "./authentication-signer";
import { DEFAULT_LOOKUP_RELAYS, DEFAULT_SIGNAL_RELAYS } from "../const";
import {
  ArrayLocalStorageEntry,
  BooleanLocalStorageEntry,
  NullableNumberLocalStorageEntry,
  NumberLocalStorageEntry,
} from "../classes/local-settings/types";
import { LocalStorageEntry } from "../classes/local-settings/entry";
import { EventPolicyRule } from "./event-policies";

// Relays
const readRelays = new ArrayLocalStorageEntry<string>("read-relays", []);
const writeRelays = new ArrayLocalStorageEntry<string>("write-relays", []);
const lookupRelays = new ArrayLocalStorageEntry<string>("lookup-relays", DEFAULT_LOOKUP_RELAYS);

// IndexedDB Relay
const idbMaxEvents = new NumberLocalStorageEntry("nostr-idb-max-events", 10_000);
const wasmPersistForDays = new NullableNumberLocalStorageEntry("wasm-relay-oldest-event", 365);

// Display
const hideZapBubbles = new BooleanLocalStorageEntry("hide-zap-bubbles", false);

// WebRTC Relay
const webRtcLocalIdentity = new LocalStorageEntry(
  "nostr-webrtc-identity",
  generateSecretKey(),
  (raw) => hexToBytes(raw),
  (key) => bytesToHex(key),
  true,
);
const webRtcSignalingRelays = new LocalStorageEntry(
  "nostr-webrtc-signaling-relays",
  DEFAULT_SIGNAL_RELAYS,
  (raw) => raw.split(",").filter((u) => !!u),
  (value) => value.join(","),
);
const webRtcRecentConnections = new LocalStorageEntry(
  "nostr-webrtc-recent-connections",
  [],
  (raw) => raw.split(",").filter((u) => !!u),
  (value) => value.join(","),
);

// Posting
const addClientTag = new BooleanLocalStorageEntry("add-client-tag", false);

// Performance
const verifyEventMethod = new LocalStorageEntry("verify-event-method", "wasm"); // wasm, internal, none
const enableKeyboardShortcuts = new BooleanLocalStorageEntry("enable-keyboard-shortcuts", true);

// Privacy
const debugApi = new BooleanLocalStorageEntry("debug-api", false);
const alwaysAuthUpload = new BooleanLocalStorageEntry("always-auth-upload", true);

// Relay Authentication
const defaultAuthenticationMode = new LocalStorageEntry<RelayAuthMode>("default-authentication-mode", "ask");
const proactivelyAuthenticate = new BooleanLocalStorageEntry("proactively-authenticate", false);
const relayAuthenticationMode = new ArrayLocalStorageEntry<{ relay: string; mode: RelayAuthMode }>(
  "relay-authentication-mode",
  [],
);

// Cache Relay
const cacheRelayURL = new LocalStorageEntry("cache-relay-url", "");

// Filtering policies
const eventsPolicy = new ArrayLocalStorageEntry<EventPolicyRule>("events-policy", []);
const mediaPolicy = new ArrayLocalStorageEntry<EventPolicyRule>("media-policy", [
  { type: "social-graph-distance", distance: 3 },
]);
const embedsPolicy = new ArrayLocalStorageEntry<EventPolicyRule>("embeds-policy", [
  { type: "social-graph-distance", distance: 3 },
]);

const localSettings = {
  readRelays,
  writeRelays,
  lookupRelays,
  idbMaxEvents,
  wasmPersistForDays,
  hideZapBubbles,
  webRtcLocalIdentity,
  webRtcSignalingRelays,
  webRtcRecentConnections,
  addClientTag,
  verifyEventMethod,
  enableKeyboardShortcuts,
  defaultAuthenticationMode,
  proactivelyAuthenticate,
  relayAuthenticationMode,
  debugApi,
  cacheRelayURL,
  alwaysAuthUpload,
  eventsPolicy,
  mediaPolicy,
  embedsPolicy,
};

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.localSettings = localSettings;
}

export default localSettings;
