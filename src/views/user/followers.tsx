import { Flex, SimpleGrid } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Event, Kind } from "nostr-tools";

import { UserCard, UserCardProps } from "./components/user-card";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { truncatedId } from "../../helpers/nostr-event";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { useMemo, useRef } from "react";

function FollowerItem({ event, ...props }: { event: Event } & Omit<UserCardProps, "pubkey">) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  return (
    <div ref={ref}>
      <UserCard pubkey={event.pubkey} {...props} />
    </div>
  );
}

export default function UserFollowersTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();
  const readRelays = useReadRelayUrls(contextRelays);

  const timeline = useTimelineLoader(`${truncatedId(pubkey)}-followers`, readRelays, {
    "#p": [pubkey],
    kinds: [Kind.Contacts],
  });

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
      <SimpleGrid minChildWidth="4in" spacing="2" py="2">
        {followers.map((event) => (
          <FollowerItem key={event.pubkey} event={event} />
        ))}
      </SimpleGrid>
      <TimelineActionAndStatus timeline={timeline} />
    </IntersectionObserverProvider>
  );
}
