import { nip19 } from "nostr-tools";
import type { AddressPointer, EventPointer } from "nostr-tools/nip19";

import { NostrEvent, isDTag } from "../types/nostr-event";
import relayScoreboardService from "./relay-scoreboard";
import userMailboxesService from "./user-mailboxes";
import { isReplaceable } from "../helpers/nostr/event";
import { eventStore } from "./event-store";

function pickBestRelays(relays: Iterable<string>) {
  // ignore local relays
  const urls = Array.from(relays).filter((url) => !url.includes("://localhost") && !url.includes("://192.168"));
  return relayScoreboardService.getRankedRelays(urls);
}

function getAddressPointerRelayHint(pointer: AddressPointer): string | undefined {
  const authorRelays = userMailboxesService.getMailboxes(pointer.pubkey).value;
  return pickBestRelays(authorRelays?.outbox || [])[0];
}

function getEventPointerRelayHints(pointerOrId: string | EventPointer): string[] {
  if (typeof pointerOrId === "string") {
    const event = eventStore.getEvent(pointerOrId);
    if (event) {
      const authorRelays = userMailboxesService.getMailboxes(event.pubkey).value;
      return pickBestRelays(authorRelays?.outbox || []);
    }
  } else if (pointerOrId.author) {
    const authorRelays = userMailboxesService.getMailboxes(pointerOrId.author).value;
    return pickBestRelays(authorRelays?.outbox || []);
  }

  return [];
}
function getEventPointerRelayHint(pointerOrId: string | EventPointer): string | undefined {
  return getEventPointerRelayHints(pointerOrId)[0];
}

function getEventRelayHint(event: NostrEvent): string | undefined {
  return getEventRelayHints(event, 1)[0];
}

function getEventRelayHints(event: NostrEvent, count = 2): string[] {
  const authorRelays = userMailboxesService.getMailboxes(event.pubkey).value?.outbox || [];

  return pickBestRelays(authorRelays).slice(0, count);
}

function getSharableEventAddress(event: NostrEvent, relays?: Iterable<string>) {
  relays = relays || relayHintService.getEventRelayHints(event, 2);

  if (isReplaceable(event.kind)) {
    const d = event.tags.find(isDTag)?.[1];
    if (!d) return null;
    return nip19.naddrEncode({ kind: event.kind, identifier: d, pubkey: event.pubkey, relays: Array.from(relays) });
  } else {
    return nip19.neventEncode({ id: event.id, kind: event.kind, relays: Array.from(relays), author: event.pubkey });
  }
}

const relayHintService = {
  getEventRelayHints,
  getEventRelayHint,
  getEventPointerRelayHint,
  getEventPointerRelayHints,
  getSharableEventAddress,
  getAddressPointerRelayHint,
  pickBestRelays,
};

export default relayHintService;
