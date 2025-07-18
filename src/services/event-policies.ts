import { NostrEvent } from "nostr-social-graph";
import localSettings from "./preferences";
import { socialGraph$ } from "./social-graph";

/** Checks if an event should be hidden based on the social graph distance */
export function shouldHideEvent(event: NostrEvent) {
  const graph = socialGraph$.value;
  const distance = graph.getFollowDistance(event.pubkey);
  if (
    localSettings.hideEventsOutsideSocialGraph.value !== null &&
    distance > localSettings.hideEventsOutsideSocialGraph.value
  )
    return true;

  return false;
}

/** Checks if media should be blurred based on the social graph distance */
export function shouldBlurMedia(event: NostrEvent) {
  const graph = socialGraph$.value;
  const distance = graph.getFollowDistance(event.pubkey);
  if (
    localSettings.blurMediaOutsideSocialGraph.value !== null &&
    distance > localSettings.blurMediaOutsideSocialGraph.value
  )
    return true;

  return false;
}

/** Checks if embeds should be hidden based on the social graph distance */
export function shouldHideEmbed(event: NostrEvent) {
  const graph = socialGraph$.value;
  const distance = graph.getFollowDistance(event.pubkey);
  if (
    localSettings.hideEmbedsOutsideSocialGraph.value !== null &&
    distance > localSettings.hideEmbedsOutsideSocialGraph.value
  )
    return true;

  return false;
}
