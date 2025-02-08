import { kinds, nip19, NostrEvent } from "nostr-tools";
import type { AddressPointer, EventPointer } from "nostr-tools/nip19";

import relayScoreboardService from "./relay-scoreboard";
import { eventStore } from "./event-store";
import { getOutboxes, getSeenRelays, getTagValue, isReplaceable } from "applesauce-core/helpers";

/** Filters and sorts relays */
function pickBestRelays(relays: Iterable<string>) {
  // ignore local relays
  const urls = Array.from(relays).filter((url) => !url.includes("://localhost") && !url.includes("://192.168"));
  return relayScoreboardService.getRankedRelays(urls);
}

function getAuthorHints(pubkey: string) {
  const mailboxes = eventStore.getReplaceable(kinds.RelayList, pubkey);
  const outbox = mailboxes && getOutboxes(mailboxes);
  return outbox ? Array.from(outbox) : [];
}
function getSeenHints(id: string | NostrEvent) {
  let event: NostrEvent | undefined = undefined;
  if (typeof id === "string") event = eventStore.getEvent(id);
  else event = id;

  if (!event) return [];
  const seen = getSeenRelays(event);
  if (!seen) return [];
  return Array.from(seen);
}

/** returns relay hints for an event */
export function getEventRelayHints(event: NostrEvent, count = 2): string[] {
  return pickBestRelays([...getAuthorHints(event.pubkey), ...getSeenHints(event)]).slice(0, count);
}

/** Returns relay things for an address pointer */
export function getAddressPointerRelayHints(pointer: AddressPointer) {
  return pickBestRelays([...getAuthorHints(pointer.pubkey)]);
}

/** Gets relay hints for an event pointer */
export function getEventPointerRelayHints(pointerOrId: string | EventPointer): string[] {
  if (typeof pointerOrId === "string") {
    const event = eventStore.getEvent(pointerOrId);

    return event ? getEventRelayHints(event) : [];
  } else {
    const event = eventStore.getEvent(pointerOrId.id);

    if (event) return getEventRelayHints(event);
    else if (pointerOrId.author) return getAuthorHints(pointerOrId.author);
    else return [];
  }
}

/** Gets a single relay hint for am event pointer */
export function getEventPointerRelayHint(pointerOrId: string | EventPointer): string | undefined {
  return getEventPointerRelayHints(pointerOrId)[0];
}

/** Returns a single relay hint for an event */
export function getEventRelayHint(id: string): string | undefined {
  const event = eventStore.getEvent(id);
  return event && getEventRelayHints(event, 1)[0];
}

/** Returns a relay hint for a single pubkey */
export function getPubkeyRelayHint(pubkey: string): string | undefined {
  return getAuthorHints(pubkey)[0];
}

/** Returns a nevent or naddr for an event */
export function getSharableEventAddress(event: NostrEvent, relays?: Iterable<string>) {
  relays = relays || getEventRelayHints(event, 2);

  if (isReplaceable(event.kind)) {
    const d = getTagValue(event, "d");
    if (!d) return null;
    return nip19.naddrEncode({ kind: event.kind, identifier: d, pubkey: event.pubkey, relays: Array.from(relays) });
  } else {
    return nip19.neventEncode({ id: event.id, kind: event.kind, relays: Array.from(relays), author: event.pubkey });
  }
}
