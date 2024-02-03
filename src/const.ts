import { safeRelayUrl, safeRelayUrls } from "./helpers/relay";

export const SEARCH_RELAYS = safeRelayUrls([
  "wss://relay.nostr.band",
  "wss://search.nos.today",
  "wss://relay.noswhere.com",
  // TODO: requires NIP-42 auth
  // "wss://filter.nostr.wine",
]);
export const COMMON_CONTACT_RELAY = safeRelayUrl("wss://purplepag.es") as string;
