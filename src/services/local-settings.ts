import { generateSecretKey } from "nostr-tools";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import { PersistentSubject } from "../classes/subject";
import { DEFAULT_SIGNAL_RELAYS } from "../const";
import {
  BooleanLocalStorageEntry,
  NullableNumberLocalStorageEntry,
  NumberLocalStorageEntry,
} from "../classes/local-settings/types";
import { LocalStorageEntry } from "../classes/local-settings/entry";

// local relay
const idbMaxEvents = new NumberLocalStorageEntry("nostr-idb-max-events", 10_000);
const wasmPersistForDays = new NullableNumberLocalStorageEntry("wasm-relay-oldest-event", 365);

// note behavior
const enableNoteThreadDrawer = new LocalStorageEntry(
  "enable-note-thread-drawer",
  false,
  (raw) => raw === "true",
  (v) => String(v),
);

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

const localSettings = {
  idbMaxEvents,
  wasmPersistForDays,
  enableNoteThreadDrawer,
  hideZapBubbles,
  webRtcLocalIdentity,
  webRtcSignalingRelays,
  webRtcRecentConnections,
};

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.localSettings = localSettings;
}

export default localSettings;
