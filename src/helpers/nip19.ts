import { bech32 } from "bech32";
import { getPublicKey, nip19 } from "nostr-tools";
import { getEventRelays } from "../services/event-relays";
import relayScoreboardService from "../services/relay-scoreboard";
import { NostrEvent, isDTag } from "../types/nostr-event";
import { getEventUID } from "./nostr/events";

export function isHexKey(key?: string) {
  if (key?.toLowerCase()?.match(/^[0-9a-f]{64}$/)) return true;
  return false;
}

/** @deprecated */
export function isBech32Key(bech32String: string) {
  try {
    const { prefix } = bech32.decode(bech32String.toLowerCase());
    if (!prefix) return false;
    if (!isHexKey(bech32ToHex(bech32String))) return false;
  } catch (error) {
    return false;
  }
  return true;
}

/** @deprecated */
export function bech32ToHex(bech32String: string) {
  try {
    const { words } = bech32.decode(bech32String);
    return toHexString(new Uint8Array(bech32.fromWords(words)));
  } catch (error) {}
  return "";
}

/** @deprecated */
export function toHexString(buffer: Uint8Array) {
  return buffer.reduce((s, byte) => {
    let hex = byte.toString(16);
    if (hex.length === 1) hex = "0" + hex;
    return s + hex;
  }, "");
}

export function safeDecode(str: string) {
  try {
    return nip19.decode(str);
  } catch (e) {}
}

export function getPubkey(result: nip19.DecodeResult) {
  switch (result.type) {
    case "naddr":
    case "nprofile":
      return result.data.pubkey;
    case "npub":
      return result.data;
    case "nsec":
      return getPublicKey(result.data);
  }
}

export function normalizeToHex(hex: string) {
  if (isHexKey(hex)) return hex;
  if (isBech32Key(hex)) return bech32ToHex(hex);
  return null;
}

export function getSharableNoteId(eventId: string) {
  const relays = getEventRelays(eventId).value;
  const ranked = relayScoreboardService.getRankedRelays(relays);
  const onlyTwo = ranked.slice(0, 2);

  if (onlyTwo.length > 0) {
    return nip19.neventEncode({ id: eventId, relays: onlyTwo });
  } else return nip19.noteEncode(eventId);
}

export function getSharableEventNaddr(event: NostrEvent) {
  const relays = getEventRelays(getEventUID(event)).value;
  const ranked = relayScoreboardService.getRankedRelays(relays);
  const onlyTwo = ranked.slice(0, 2);

  const d = event.tags.find(isDTag)?.[1];

  if (!d) return null;

  return nip19.naddrEncode({ kind: event.kind, identifier: d, pubkey: event.pubkey, relays: onlyTwo });
}
