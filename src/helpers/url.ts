import { utils } from "nostr-tools";

export function validateRelayUrl(relayUrl: string) {
  const normalized = utils.normalizeURL(relayUrl);
  const url = new URL(normalized);

  if (url.protocol !== "wss:" && url.protocol !== "ws:") throw new Error("Incorrect protocol");

  return url.toString();
}

export function safeRelayUrl(relayUrl: string) {
  try {
    return validateRelayUrl(relayUrl);
  } catch (e) {}
  return null;
}
