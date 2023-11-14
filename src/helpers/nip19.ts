import { bech32 } from "bech32";
import { getPublicKey, nip19 } from "nostr-tools";
import { getEventRelays } from "../services/event-relays";
import relayScoreboardService from "../services/relay-scoreboard";
import { NostrEvent, Tag, isATag, isDTag, isETag, isPTag } from "../types/nostr-event";
import { getEventUID, isReplaceable } from "./nostr/events";
import { DecodeResult } from "nostr-tools/lib/types/nip19";

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

export function getPubkey(result?: nip19.DecodeResult) {
  if (!result) return;
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

/** @deprecated */
export function normalizeToHex(hex: string) {
  if (isHexKey(hex)) return hex;
  if (isBech32Key(hex)) return bech32ToHex(hex);
  return null;
}

export function getSharableEventAddress(event: NostrEvent) {
  const relays = getEventRelays(getEventUID(event)).value;
  const ranked = relayScoreboardService.getRankedRelays(relays);
  const maxTwo = ranked.slice(0, 2);

  if (isReplaceable(event.kind)) {
    const d = event.tags.find(isDTag)?.[1];
    if (!d) return null;
    return nip19.naddrEncode({ kind: event.kind, identifier: d, pubkey: event.pubkey, relays: maxTwo });
  } else {
    if (maxTwo.length == 2) {
      return nip19.neventEncode({ id: event.id, relays: maxTwo });
    } else return nip19.neventEncode({ id: event.id, relays: maxTwo, author: event.pubkey });
  }
}

export function encodePointer(pointer: DecodeResult) {
  switch (pointer.type) {
    case "naddr":
      return nip19.naddrEncode(pointer.data);
    case "nprofile":
      return nip19.nprofileEncode(pointer.data);
    case "nevent":
      return nip19.neventEncode(pointer.data);
    case "nrelay":
      return nip19.nrelayEncode(pointer.data);
    case "nsec":
      return nip19.nsecEncode(pointer.data);
    case "npub":
      return nip19.npubEncode(pointer.data);
    case "note":
      return nip19.noteEncode(pointer.data);
  }
}

export function getPointerFromTag(tag: Tag): DecodeResult | null {
  if (isETag(tag)) {
    if (!tag[1]) return null;
    return {
      type: "nevent",
      data: {
        id: tag[1],
        relays: tag[2] ? [tag[2]] : undefined,
      },
    };
  } else if (isATag(tag)) {
    const [_, coordinate, relay] = tag;
    const parts = coordinate.split(":") as (string | undefined)[];
    const kind = parts[0] && parseInt(parts[0]);
    const pubkey = parts[1];
    const d = parts[2];

    if (!kind) return null;
    if (!pubkey) return null;
    if (!d) return null;

    return {
      type: "naddr",
      data: {
        kind,
        pubkey,
        identifier: d,
        relays: relay ? [relay] : undefined,
      },
    };
  } else if (isPTag(tag)) {
    const [_, pubkey, relay] = tag;
    if (!pubkey) return null;
    return { type: "nprofile", data: { pubkey, relays: relay ? [relay] : undefined } };
  }
  return null;
}
