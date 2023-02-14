import { NostrEvent } from "../types/nostr-event";
import { Bech32Prefix, normalizeToBech32 } from "./nip-19";
import { truncatedId } from "./nostr-event";
import { safeJson } from "./parse";

export type Kind0ParsedContent = {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  lud06?: string;
  nip05?: string;
};

export function parseKind0Event(event: NostrEvent): Kind0ParsedContent {
  if (event.kind !== 0) throw new Error("expected a kind 0 event");
  try {
    return JSON.parse(event.content) as Kind0ParsedContent;
  } catch (e) {}
  return {};
}

export function getUserDisplayName(metadata: Kind0ParsedContent | undefined, pubkey: string) {
  if (metadata?.display_name && metadata?.name) {
    return metadata.display_name;
  } else if (metadata?.name) {
    return metadata.name;
  }
  return truncatedId(normalizeToBech32(pubkey, Bech32Prefix.Pubkey) ?? pubkey);
}

export function fixWebsiteUrl(website: string) {
  if (website.match(/^http?s:\/\//)) {
    return website;
  }
  return "https://" + website;
}
