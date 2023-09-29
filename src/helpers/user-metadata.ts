import { nip19 } from "nostr-tools";
import { NostrEvent } from "../types/nostr-event";
import { truncatedId } from "./nostr/events";

export type Kind0ParsedContent = {
  pubkey?: string,
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
    metadata.pubkey = event.pubkey

    // ensure nip05 is a string
    if (metadata.nip05 && typeof metadata.nip05 !== "string") metadata.nip05 = String(metadata.nip05);

    // fix user website
    if (metadata.website) metadata.website = fixWebsiteUrl(metadata.website);

    return metadata;
  } catch (e) {}
  return {};
}

export function getUserDisplayName(metadata: Kind0ParsedContent | undefined, pubkey: string) {
  return metadata?.display_name || metadata?.name || truncatedId(nip19.npubEncode(pubkey));
}

export function fixWebsiteUrl(website: string) {
  if (website.match(/^http?s:\/\//)) {
    return website;
  }
  return "https://" + website;
}
