import { useMemo } from "react";
import { Flex, SimpleGrid } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Event, kinds } from "nostr-tools";

import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import UserLink from "../../components/user/user-link";
import UserAvatarLink from "../../components/user/user-avatar-link";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import SimpleView from "../../components/layout/presets/simple-view";

function FollowerItem({ event }: { event: Event }) {
  const ref = useEventIntersectionRef(event);

  return (
    <Flex gap="2" overflow="hidden" alignItems="center" ref={ref}>
      <UserAvatarLink pubkey={event.pubkey} noProxy size="sm" />
      <UserLink pubkey={event.pubkey} isTruncated />
    </Flex>
  );
}

export default function UserFollowersTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useReadRelays();

  const { loader, timeline: events } = useTimelineLoader(`${pubkey}-followers`, readRelays, {
    "#p": [pubkey],
    kinds: [kinds.Contacts],
  });

  const callback = useTimelineCurserIntersectionCallback(loader);

  const followers = useMemo(() => {
    const dedupe = new Map<string, Event>();
    for (const event of events) {
      dedupe.set(event.pubkey, event);
    }
    return Array.from(dedupe.values());
  }, [events]);

  return (
    <SimpleView title="Followers">
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing="2">
          {followers.map((event) => (
            <FollowerItem key={event.pubkey} event={event} />
          ))}
        </SimpleGrid>
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </SimpleView>
  );
}
