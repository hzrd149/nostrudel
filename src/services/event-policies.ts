import { NostrEvent } from "nostr-social-graph";
import { combineLatest, map, shareReplay } from "rxjs";

import localSettings from "./preferences";
import { socialGraph$, socialGraphVersion$ } from "./social-graph";

export type EventPolicies = {
  /** Checks if an event should be hidden based on the social graph distance */
  shouldHideEvent: (event: NostrEvent) => boolean;
  /** Checks if media should be blurred based on the social graph distance */
  shouldBlurMedia: (event: NostrEvent) => boolean;
  /** Checks if embeds should be hidden based on the social graph distance */
  shouldHideEmbed: (event: NostrEvent) => boolean;
};

/** Social graph based content policies, re-emitted when the graph or the distance settings change */
export const eventPolicies$ = combineLatest([
  socialGraph$,
  socialGraphVersion$,
  localSettings.hideEventsOutsideSocialGraph,
  localSettings.blurMediaOutsideSocialGraph,
  localSettings.hideEmbedsOutsideSocialGraph,
]).pipe(
  map(([graph, _version, hideEvents, blurMedia, hideEmbeds]): EventPolicies => {
    const outside = (event: NostrEvent, maxDistance: number | null) =>
      maxDistance !== null && graph.getFollowDistance(event.pubkey) > maxDistance;

    return {
      shouldHideEvent: (event) => outside(event, hideEvents),
      shouldBlurMedia: (event) => outside(event, blurMedia),
      shouldHideEmbed: (event) => outside(event, hideEmbeds),
    };
  }),
  shareReplay(1),
);
