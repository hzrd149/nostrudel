import { NostrEvent } from "../types/nostr-event";
import { Bech32Prefix, normalizeToBech32 } from "./nip19";
import { truncatedId } from "./nostr-event";

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
    const metadata = JSON.parse(event.content) as Kind0ParsedContent;

    // ensure nip05 is a string
    if (metadata.nip05 && typeof metadata.nip05 !== "string") metadata.nip05 = String(metadata.nip05);

    return metadata;
  } catch (e) {}
  return {};
}

export function getUserDisplayName(metadata: Kind0ParsedContent | undefined, pubkey: string) {
  return (
    metadata?.display_name || metadata?.name || truncatedId(normalizeToBech32(pubkey, Bech32Prefix.Pubkey) ?? pubkey)
  );
}

export function fixWebsiteUrl(website: string) {
  if (website.match(/^http?s:\/\//)) {
    return website;
  }
  return "https://" + website;
}
