import { Flex, SimpleGrid } from "@chakra-ui/react";
import { Event, kinds } from "nostr-tools";
import { useMemo } from "react";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

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
  const user = useParamsProfilePointer("pubkey");
  const readRelays = useReadRelays();

  const { loader, timeline: events } = useTimelineLoader(`${user.pubkey}-followers`, readRelays, {
    "#p": [user.pubkey],
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
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing="2">
          {followers.map((event) => (
            <FollowerItem key={event.pubkey} event={event} />
          ))}
        </SimpleGrid>
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
