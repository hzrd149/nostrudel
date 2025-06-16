import { Model } from "applesauce-core";
import { kinds, NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer, ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, filter, of, switchMap } from "rxjs";

import { getProfileBadges, PROFILE_BADGES_IDENTIFIER } from "../helpers/nostr/badges";
import { AddressableQuery } from "./addressable";
import EventQuery from "./events";

export function ProfileBadgesQuery(user: ProfilePointer): Model<
  {
    badge: NostrEvent | undefined;
    badgePointer: AddressPointer;
    award: NostrEvent | undefined;
    awardPointer: EventPointer;
  }[]
> {
  return (events) =>
    events
      .model(AddressableQuery, {
        ...user,
        kind: kinds.ProfileBadges,
        identifier: PROFILE_BADGES_IDENTIFIER,
      })
      .pipe(
        // Wait for the event to be loaded
        filter((b) => !!b),
        // Request the badge events
        switchMap((event) =>
          combineLatest(
            getProfileBadges(event).map((badge) =>
              combineLatest({
                badge: events.model(AddressableQuery, badge.badge),
                award: events.model(EventQuery, badge.award),
                badgePointer: of(badge.badge),
                awardPointer: of(badge.award),
              }),
            ),
          ),
        ),
      );
}
