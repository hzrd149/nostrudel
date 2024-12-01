import { safeRelayUrls } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

export const DEFAULT_SEARCH_RELAYS = safeRelayUrls([
  "wss://relay.nostr.band",
  "wss://search.nos.today",
  "wss://relay.noswhere.com",
  "wss://filter.nostr.wine",
]);
export const WIKI_RELAYS = safeRelayUrls(["wss://relay.wikifreedia.xyz/"]);
export const COMMON_CONTACT_RELAYS = safeRelayUrls(["wss://purplepag.es/"]);

export const DEFAULT_SIGNAL_RELAYS = safeRelayUrls(["wss://nostrue.com/", "wss://relay.damus.io"]);
export const DEFAULT_NOSTR_CONNECT_RELAYS = safeRelayUrls(["wss://relay.nsec.app/"]);

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
export const NIP_89_CLIENT_TAG = [
  "client",
  "noStrudel",
  "31990:266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5:1686066542546",
];

export const SUPPORT_PUBKEY = "713978c3094081b34fcf2f5491733b0c22728cd3b7a6946519d40f5f08598af8";
