import { getPublicKey, nip19 } from "nostr-tools";

import { Tag, isATag, isETag, isPTag } from "../types/nostr-event";
import { safeRelayUrls } from "./relay";
import { parseCoordinate } from "./nostr/event";

export function isHex(str?: string) {
  if (str?.match(/^[0-9a-f]+$/i)) return true;
  return false;
}
export function isHexKey(key?: string) {
  if (key?.toLowerCase()?.match(/^[0-9a-f]{64}$/)) return true;
  return false;
}

export function safeDecode(str: string) {
  try {
    const result = nip19.decode(str);
    if ((result.type === "nevent" || result.type === "nprofile" || result.type === "naddr") && result.data.relays)
      result.data.relays = safeRelayUrls(result.data.relays);
    return result;
  } catch (e) {}
}

export function getPubkeyFromDecodeResult(result?: nip19.DecodeResult) {
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

export function normalizeToHexPubkey(hex: string) {
  if (isHexKey(hex)) return hex;
  const decode = safeDecode(hex);
  if (!decode) return null;
  return getPubkeyFromDecodeResult(decode) ?? null;
}

export function encodeDecodeResult(result: nip19.DecodeResult) {
  switch (result.type) {
    case "naddr":
      return nip19.naddrEncode(result.data);
    case "nprofile":
      return nip19.nprofileEncode(result.data);
    case "nevent":
      return nip19.neventEncode(result.data);
    case "nrelay":
      return nip19.nrelayEncode(result.data);
    case "nsec":
      return nip19.nsecEncode(result.data);
    case "npub":
      return nip19.npubEncode(result.data);
    case "note":
      return nip19.noteEncode(result.data);
  }
}

export function getPointerFromTag(tag: Tag): nip19.DecodeResult | null {
  switch (tag[0]) {
    case "e": {
      if (!tag[1]) return null;

      const pointer: nip19.DecodeResult = { type: "nevent", data: { id: tag[1] } };
      if (tag[2]) pointer.data.relays = [tag[2]];
      return pointer;
    }
    case "a": {
      const parsed = parseCoordinate(tag[1]);
      if (!parsed?.identifier) return null;

      const pointer: nip19.DecodeResult = {
        type: "naddr",
        data: { pubkey: parsed.pubkey, identifier: parsed.identifier, kind: parsed.kind },
      };
      if (tag[2]) pointer.data.relays = [tag[2]];
      return pointer;
    }
    case "p": {
      const [_, pubkey, relay] = tag;
      if (!pubkey) return null;
      return { type: "nprofile", data: { pubkey, relays: relay ? [relay] : undefined } };
    }
  }
  return null;
}
