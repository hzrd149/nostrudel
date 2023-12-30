import { Flex, SimpleGrid } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Event, Kind } from "nostr-tools";

import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { useMemo, useRef } from "react";
import { getEventUID } from "../../helpers/nostr/events";
import UserLink from "../../components/user-link";
import UserAvatarLink from "../../components/user-avatar-link";

function FollowerItem({ event }: { event: Event }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Flex gap="2" overflow="hidden" alignItems="center" ref={ref}>
      <UserAvatarLink pubkey={event.pubkey} noProxy size="sm" />
      <UserLink pubkey={event.pubkey} isTruncated />
    </Flex>
  );
}

export default function UserFollowersTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useReadRelayUrls();

  const timeline = useTimelineLoader(`${pubkey}-followers`, readRelays, {
    "#p": [pubkey],
    kinds: [Kind.Contacts],
  });

  const lists = useSubject(timeline.timeline);
  const followerEvents = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const followers = useMemo(() => {
    const dedupe = new Map<string, Event>();
    for (const event of followerEvents) {
      dedupe.set(event.pubkey, event);
    }
    return Array.from(dedupe.values());
  }, [followerEvents]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing="2" p="2">
        {followers.map((event) => (
          <FollowerItem key={event.pubkey} event={event} />
        ))}
      </SimpleGrid>
      <TimelineActionAndStatus timeline={timeline} />
    </IntersectionObserverProvider>
  );
}
