import { nip19 } from "nostr-tools";
import emojiRegex from "emoji-regex";
import { truncatedId } from "./event";
import { ProfileContent } from "applesauce-core/helpers";

export function getSearchNames(profile: ProfileContent) {
  if (!profile) return [];

  return [profile.displayName, profile.display_name, profile.name].filter(Boolean) as string[];
}

const matchEmoji = emojiRegex();
export function getDisplayName(metadata: ProfileContent | undefined, pubkey: string, removeEmojis = false) {
  let displayName = metadata?.displayName || metadata?.display_name || metadata?.name;

  if (displayName) {
    if (removeEmojis) displayName = displayName.replaceAll(matchEmoji, "");
    return displayName;
  }

  return truncatedId(nip19.npubEncode(pubkey));
}
