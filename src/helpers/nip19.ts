import { nip19 } from "nostr-tools";
import { getPubkeyFromDecodeResult, isHexKey } from "applesauce-core/helpers";
import { isSafeRelayURL } from "applesauce-core/helpers/relays";

export function safeDecode(str: string) {
  try {
    const result = nip19.decode(str);
    if ((result.type === "nevent" || result.type === "nprofile" || result.type === "naddr") && result.data.relays)
      result.data.relays = result.data.relays.filter(isSafeRelayURL);
    return result;
  } catch (e) {}
}

export function normalizeToHexPubkey(hex: string) {
  if (isHexKey(hex)) return hex;
  const decode = safeDecode(hex);
  if (!decode) return null;
  return getPubkeyFromDecodeResult(decode) ?? null;
}
