import { Kind } from "nostr-tools";

import useReplaceableEvent from "./use-replaceable-event";
import { PROFILE_BADGES_IDENTIFIER, parseProfileBadges } from "../helpers/nostr/badges";
import useReplaceableEvents from "./use-replaceable-events";
import useSingleEvents from "./use-single-events";
import { getEventCoordinate } from "../helpers/nostr/events";
import { NostrEvent } from "../types/nostr-event";

export default function useUserProfileBadges(pubkey: string, additionalRelays: string[] = []) {
  const profileBadgesEvent = useReplaceableEvent({
    pubkey,
    kind: Kind.ProfileBadge,
    identifier: PROFILE_BADGES_IDENTIFIER,
  });
  const parsed = profileBadgesEvent ? parseProfileBadges(profileBadgesEvent) : [];

  const badges = useReplaceableEvents(parsed.map((b) => b.badgeCord));
  const awardEvents = useSingleEvents(parsed.map((b) => b.awardEventId));

  const final: { badge: NostrEvent; award: NostrEvent }[] = [];
  for (const p of parsed) {
    const badge = badges.find((e) => getEventCoordinate(e) === p.badgeCord);
    const award = awardEvents.find((e) => e.id === p.awardEventId);

    if (badge && award) final.push({ badge, award });
  }

  return final;
}
