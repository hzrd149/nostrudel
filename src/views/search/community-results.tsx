import { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import { useRef } from "react";
import { getEventUID } from "../../helpers/nostr/events";
import { NostrEvent } from "../../types/nostr-event";
import CommunityCard from "../communities/components/community-card";
import useSubject from "../../hooks/use-subject";

function CommunityResult({ community }: { community: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(community));

  return (
    <div ref={ref}>
      <CommunityCard community={community} maxW="xl" />
    </div>
  );
}

export default function CommunitySearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();

  const timeline = useTimelineLoader(
    `${search}-community-search`,
    searchRelays,
    { search: search || "", kinds: [COMMUNITY_DEFINITION_KIND] },
    { enabled: !!search },
  );

  const communities = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <IntersectionObserverProvider callback={callback}>
        {communities.map((community) => (
          <CommunityResult key={getEventUID(community)} community={community} />
        ))}
      </IntersectionObserverProvider>
    </IntersectionObserverProvider>
  );
}
