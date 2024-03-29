import { NostrEvent } from "nostr-tools";
import { RelayMode } from "../../classes/relay";
import { safeJson } from "../parse";
import { safeRelayUrl } from "../relay";

type RelayJson = Record<string, { read: boolean; write: boolean }>;
export function relaysFromContactsEvent(event: NostrEvent) {
  const relayJson = safeJson(event.content, {}) as RelayJson;

  const relays: { url: string; mode: RelayMode }[] = [];
  for (const [url, opts] of Object.entries(relayJson)) {
    const safeUrl = safeRelayUrl(url);
    if (!safeUrl) continue;
    let mode = RelayMode.NONE;
    if (opts.write) mode = mode | RelayMode.WRITE;
    if (opts.read) mode = mode | RelayMode.READ;
    if (mode === RelayMode.NONE) mode = RelayMode.ALL;
    relays.push({ url: safeUrl, mode });
  }
  return relays;
}
