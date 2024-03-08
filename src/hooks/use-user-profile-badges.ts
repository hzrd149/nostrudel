import { kinds } from "nostr-tools";

import useReplaceableEvent from "./use-replaceable-event";
import { PROFILE_BADGES_IDENTIFIER, parseProfileBadges } from "../helpers/nostr/badges";
import useReplaceableEvents from "./use-replaceable-events";
import useSingleEvents from "./use-single-events";
import { getEventCoordinate } from "../helpers/nostr/event";
import { NostrEvent } from "../types/nostr-event";

export default function useUserProfileBadges(pubkey: string, additionalRelays?: Iterable<string>) {
  const profileBadgesEvent = useReplaceableEvent(
    {
      pubkey,
      kind: kinds.ProfileBadges,
      identifier: PROFILE_BADGES_IDENTIFIER,
    },
    additionalRelays,
  );
  const parsed = profileBadgesEvent ? parseProfileBadges(profileBadgesEvent) : [];

  const badges = useReplaceableEvents(
    parsed.map((b) => b.badgeCord),
    additionalRelays,
  );
  const awardEvents = useSingleEvents(parsed.map((b) => b.awardEventId));

  const final: { badge: NostrEvent; award: NostrEvent }[] = [];
  for (const p of parsed) {
    const badge = badges.find((e) => getEventCoordinate(e) === p.badgeCord);
    const award = awardEvents.find((e) => e.id === p.awardEventId);

    if (badge && award && badge.pubkey === award.pubkey) final.push({ badge, award });
  }

  return final;
}
