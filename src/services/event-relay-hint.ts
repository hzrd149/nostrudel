import { NostrEvent } from "../types/nostr-event";
import { getEventRelays } from "./event-relays";
import relayScoreboardService from "./relay-scoreboard";
import type { AddressPointer, EventPointer } from "nostr-tools/lib/types/nip19";
import { createCoordinate } from "./replaceable-event-requester";

function pickBestRelays(relays: string[]) {
  // ignore local relays
  relays = relays.filter((url) => !url.includes("://localhost") && !url.includes("://192.168"));

  return relayScoreboardService.getRankedRelays(relays);
}

function getAddressPointerRelayHint(pointer: AddressPointer): string | undefined {
  let relays = getEventRelays(createCoordinate(pointer.kind, pointer.pubkey, pointer.identifier)).value;
  return pickBestRelays(relays)[0];
}

function getEventPointerRelayHints(pointerOrId: string | EventPointer): string[] {
  let relays =
    typeof pointerOrId === "string" ? getEventRelays(pointerOrId).value : getEventRelays(pointerOrId.id).value;
  return pickBestRelays(relays);
}
function getEventPointerRelayHint(pointerOrId: string | EventPointer): string | undefined {
  return getEventPointerRelayHints(pointerOrId)[0];
}

function getEventRelayHint(event: NostrEvent): string | undefined {
  return getEventRelayHints(event, 1)[0];
}

function getEventRelayHints(event: NostrEvent, count = 2): string[] {
  // NOTE: in the future try to use the events authors relays

  let relays = getEventRelays(event.id).value;

  return pickBestRelays(relays).slice(0, count);
}

const relayHintService = {
  getEventRelayHints,
  getEventRelayHint,
  getEventPointerRelayHint,
  getEventPointerRelayHints,
  getAddressPointerRelayHint,
  pickBestRelays,
};

export default relayHintService;
