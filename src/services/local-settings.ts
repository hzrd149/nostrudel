import { generateSecretKey } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { nanoid } from "nanoid";

import { type RelayAuthMode } from "./authentication-signer";
import { DEFAULT_SIGNAL_RELAYS } from "../const";
import {
  ArrayLocalStorageEntry,
  BooleanLocalStorageEntry,
  NullableNumberLocalStorageEntry,
  NumberLocalStorageEntry,
} from "../classes/local-settings/types";
import { LocalStorageEntry } from "../classes/local-settings/entry";

// relays
const readRelays = new ArrayLocalStorageEntry<string>("read-relays", []);
const writeRelays = new ArrayLocalStorageEntry<string>("write-relays", []);

// local relay
const idbMaxEvents = new NumberLocalStorageEntry("nostr-idb-max-events", 10_000);
const wasmPersistForDays = new NullableNumberLocalStorageEntry("wasm-relay-oldest-event", 365);

const hideZapBubbles = new BooleanLocalStorageEntry("hide-zap-bubbles", false);

// webrtc relay
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

// posting
const addClientTag = new BooleanLocalStorageEntry("add-client-tag", false);

// performance
const verifyEventMethod = new LocalStorageEntry("verify-event-method", "wasm"); // wasm, internal, none
const enableKeyboardShortcuts = new BooleanLocalStorageEntry("enable-keyboard-shortcuts", true);

// privacy
const debugApi = new BooleanLocalStorageEntry("debug-api", false);
const alwaysAuthUpload = new BooleanLocalStorageEntry("always-auth-upload", true);

// relay authentication
const defaultAuthenticationMode = new LocalStorageEntry<RelayAuthMode>("default-authentication-mode", "ask");
const proactivelyAuthenticate = new BooleanLocalStorageEntry("proactively-authenticate", false);
const relayAuthenticationMode = new ArrayLocalStorageEntry<{ relay: string; mode: RelayAuthMode }>(
  "relay-authentication-mode",
  [],
);

// notifications
const deviceId = new LocalStorageEntry("device-id", nanoid());

const ntfyTopic = new LocalStorageEntry("ntfy-topic", nanoid());
const ntfyServer = new LocalStorageEntry("ntfy-server", "https://ntfy.sh");

// cache relay
const cacheRelayURL = new LocalStorageEntry("cache-relay-url", "");

const localSettings = {
  readRelays,
  writeRelays,
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
  deviceId,
  ntfyTopic,
  ntfyServer,
  cacheRelayURL,
  alwaysAuthUpload,
};

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.localSettings = localSettings;
}

export default localSettings;
