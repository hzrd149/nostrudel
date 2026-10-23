import { getHiddenMutedThings, getPublicMutedThings, isHiddenMutesUnlocked } from "applesauce-common/helpers";
import { NostrEvent } from "nostr-tools";

/** Returns which half of the mute list (public or hidden) a pubkey is muted in, or "unknown" if it isn't muted or the hidden half is locked */
export function getMuteHalf(muteListEvent: NostrEvent | undefined, pubkey: string): "public" | "hidden" | "unknown" {
  if (!muteListEvent) return "unknown";

  if (getPublicMutedThings(muteListEvent).pubkeys.has(pubkey)) return "public";

  if (!isHiddenMutesUnlocked(muteListEvent)) return "unknown";
  if (getHiddenMutedThings(muteListEvent)?.pubkeys.has(pubkey)) return "hidden";

  return "unknown";
}
