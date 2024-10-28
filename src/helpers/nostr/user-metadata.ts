import { NostrEvent, nip19 } from "nostr-tools";
import emojiRegex from "emoji-regex";
import { truncatedId } from "./event";
import { ProfileContent } from "applesauce-core/helpers";

export type Kind0ParsedContent = {
  pubkey?: string;
  name?: string;
  display_name?: string;
  displayName?: string;
  about?: string;
  /** @deprecated */
  image?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  lud06?: string;
  nip05?: string;
};

/** @deprecated use getProfileContent instead */
export function parseMetadataContent(event: NostrEvent): Kind0ParsedContent {
  try {
    const metadata = JSON.parse(event.content) as Kind0ParsedContent;
    metadata.pubkey = event.pubkey;

    // ensure nip05 is a string
    if (metadata.nip05 && typeof metadata.nip05 !== "string") metadata.nip05 = String(metadata.nip05);

    // fix user website
    if (metadata.website) metadata.website = fixWebsiteUrl(metadata.website);

    return metadata;
  } catch (e) {}
  return {};
}

export function getSearchNames(profile: ProfileContent) {
  if (!profile) return [];

  return [profile.displayName, profile.display_name, profile.name].filter(Boolean) as string[];
}

const matchEmoji = emojiRegex();
export function getDisplayName(metadata: Kind0ParsedContent | undefined, pubkey: string, removeEmojis = false) {
  let displayName = metadata?.displayName || metadata?.display_name || metadata?.name;

  if (displayName) {
    if (removeEmojis) displayName = displayName.replaceAll(matchEmoji, "");
    return displayName;
  }

  return truncatedId(nip19.npubEncode(pubkey));
}

export function fixWebsiteUrl(website: string) {
  if (website.match(/^http?s:\/\//)) {
    return website;
  }
  return "https://" + website;
}
