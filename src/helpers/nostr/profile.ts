import { nip19 } from "nostr-tools";
import emojiRegex from "emoji-regex";
import { ProfileContent } from "applesauce-core/helpers";

import { truncatedId } from "./event";

export function getSearchNames(profile: ProfileContent) {
  if (!profile) return [];

  return [profile.display_name, profile.name, profile.displayName].filter(Boolean) as string[];
}

const matchEmoji = emojiRegex();
export function getDisplayName(metadata: ProfileContent | undefined, pubkey: string, removeEmojis = false) {
  let displayName = metadata?.display_name || metadata?.displayName || metadata?.name;

  if (displayName) {
    if (removeEmojis) displayName = displayName.replaceAll(matchEmoji, "");
    return displayName;
  }

  return truncatedId(nip19.npubEncode(pubkey));
}
