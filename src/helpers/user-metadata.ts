import { Kind0ParsedContent } from "../types/nostr-event";
import { Bech32Prefix, normalizeToBech32 } from "./nip-19";
import { truncatedId } from "./nostr-event";

export function getUserDisplayName(metadata: Kind0ParsedContent | undefined, pubkey: string) {
  if (metadata?.display_name && metadata?.name) {
    return `${metadata.display_name} (${metadata.name})`;
  } else if (metadata?.name) {
    return metadata.name;
  }
  return truncatedId(normalizeToBech32(pubkey, Bech32Prefix.Pubkey) ?? pubkey);
}
