import { nip19 } from "nostr-tools";
import emojiRegex from "emoji-regex";
import { ProfileContent } from "applesauce-core/helpers";

import { truncateId } from "../string";

const matchEmoji = emojiRegex();
export function getDisplayName(metadata: ProfileContent | undefined, pubkey: string, removeEmojis = false) {
  let displayName = metadata?.display_name || metadata?.displayName || metadata?.name;

  if (displayName) {
    if (removeEmojis) displayName = displayName.replaceAll(matchEmoji, "");
    return displayName;
  }

  return truncateId(nip19.npubEncode(pubkey));
}
