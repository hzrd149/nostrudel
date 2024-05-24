import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import { getEventUID } from "../../helpers/nostr/event";
import { NostrEvent } from "../../types/nostr-event";
import CommunityCard from "../communities/components/community-card";
import useSubject from "../../hooks/use-subject";
import { usePeopleListContext } from "../../providers/local/people-list-provider";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

function CommunityResult({ community }: { community: NostrEvent }) {
  const ref = useEventIntersectionRef(community);

  return (
    <div ref={ref}>
      <CommunityCard community={community} maxW="xl" />
    </div>
  );
}

export default function CommunitySearchResults({ search }: { search: string }) {
  const searchRelays = useAdditionalRelayContext();
  const { listId, filter } = usePeopleListContext();

  const timeline = useTimelineLoader(
    `${listId ?? "global"}-${search}-community-search`,
    searchRelays,
    search ? { search: search, kinds: [COMMUNITY_DEFINITION_KIND], ...filter } : undefined,
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
