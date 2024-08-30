import { kinds } from "nostr-tools";
import { safeRelayUrl, safeRelayUrls } from "./helpers/relay";

export const DEFAULT_SEARCH_RELAYS = safeRelayUrls([
  "wss://relay.nostr.band",
  "wss://search.nos.today",
  "wss://relay.noswhere.com",
  "wss://filter.nostr.wine",
]);
export const WIKI_RELAYS = safeRelayUrls(["wss://relay.wikifreedia.xyz/"]);
export const COMMON_CONTACT_RELAY = safeRelayUrl("wss://purplepag.es") as string;
export const COMMON_CONTACT_RELAYS = [COMMON_CONTACT_RELAY];

export const DEFAULT_SIGNAL_RELAYS = safeRelayUrls(["wss://nostrue.com/", "wss://relay.damus.io"]);
export const DEFAULT_NOSTR_CONNECT_RELAYS = safeRelayUrls(["wss://relay.nsec.app"]);

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: ["stun:freeturn.net:3479"],
  },
  {
    urls: ["turn:freeturn.net:3479"],
    username: "free",
    credential: "free",
  },
  {
    urls: ["stun:stun.l.google.com:19302"],
  },
  {
    urls: ["turn:172.234.18.173:3478"],
    username: "free",
    credential: "free",
  },
];

export const NOSTR_CONNECT_PERMISSIONS = [
  "get_public_key",
  "nip04_encrypt",
  "nip04_decrypt",
  "nip44_encrypt",
  "nip44_decrypt",
  "sign_event:0",
  "sign_event:1",
  "sign_event:3",
  "sign_event:4",
  "sign_event:6",
  "sign_event:7",
];

export const NEVER_ATTACH_CLIENT_TAG = [kinds.EncryptedDirectMessage];
export const ENABLE_CLIENT_TAG = import.meta.env.VITE_ENABLE_CLIENT_TAG !== "false";
export const NIP_89_CLIENT_TAG = [
  "client",
  "noStrudel",
  "31990:266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5:1686066542546",
];
