import { memo, useEffect, useMemo, useRef } from "react";
import { Button, ButtonGroup, Flex, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import RequireCurrentAccount from "../../providers/route/require-current-account";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotificationTimeline } from "../../providers/global/notification-timeline";
import { getEventUID, isReply } from "../../helpers/nostr/events";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NotificationItem from "./notification-item";
import NotificationTypeToggles from "./notification-type-toggles";
import { NostrEvent } from "../../types/nostr-event";
import { groupByDay } from "../../helpers/notification";
import DayGroup from "./components/day-group";
import { useThrottle } from "react-use";
import TimelineLoader from "../../classes/timeline-loader";

const NotificationDay = memo(({ day, events }: { day: number; events: NostrEvent[] }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(events[events.length - 1]));

  return (
    <DayGroup day={day} ref={ref} hideRefOnClose>
      {events.map((event) => (
        <NotificationItem key={event.id} event={event} />
      ))}
    </DayGroup>
  );
});

const NotificationsTimeline = memo(
  ({
    timeline,
    showReplies,
    showMentions,
    showZaps,
    showReposts,
    showReactions,
  }: {
    timeline: TimelineLoader;
    showReplies: boolean;
    showMentions: boolean;
    showZaps: boolean;
    showReposts: boolean;
    showReactions: boolean;
  }) => {
    const { people } = usePeopleListContext();
    const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

    const events = useSubject(timeline.timeline);

    const throttledEvents = useThrottle(events, 500);
    const filteredEvents = useMemo(
      () =>
        throttledEvents.filter((e) => {
          if (peoplePubkeys && e.kind !== Kind.Zap && !peoplePubkeys.includes(e.pubkey)) return false;

          if (e.kind === Kind.Text) {
            if (!showReplies && isReply(e)) return false;
            if (!showMentions && !isReply(e)) return false;
          }
          if (!showReactions && e.kind === Kind.Reaction) return false;
          if (!showReposts && e.kind === Kind.Repost) return false;
          if (!showZaps && e.kind === Kind.Zap) return false;

          return true;
        }),
      [throttledEvents, peoplePubkeys, showReplies, showMentions, showReactions, showReposts, showZaps],
    );
    const sortedDays = useMemo(() => groupByDay(filteredEvents), [filteredEvents]);

    return (
      <>
        {sortedDays.map(([day, events]) => (
          <NotificationDay key={day} day={day} events={events} />
        ))}
      </>
    );
  },
);

function NotificationsPage() {
  const showReplies = useDisclosure({ defaultIsOpen: localStorage.getItem("notifications-show-replies") !== "false" });
  const showMentions = useDisclosure({
    defaultIsOpen: localStorage.getItem("notifications-show-mentions") !== "false",
  });
  const showZaps = useDisclosure({ defaultIsOpen: localStorage.getItem("notifications-show-zaps") !== "false" });
  const showReposts = useDisclosure({ defaultIsOpen: localStorage.getItem("notifications-show-reposts") !== "false" });
  const showReactions = useDisclosure({
    defaultIsOpen: localStorage.getItem("notifications-show-reactions") !== "false",
  });

  // save toggles to localStorage when changed
  useEffect(() => {
    localStorage.setItem("notifications-show-replies", String(showReplies.isOpen));
    localStorage.setItem("notifications-show-mentions", String(showMentions.isOpen));
    localStorage.setItem("notifications-show-zaps", String(showZaps.isOpen));
    localStorage.setItem("notifications-show-reposts", String(showReposts.isOpen));
    localStorage.setItem("notifications-show-reactions", String(showReactions.isOpen));
  }, [showReplies.isOpen, showMentions.isOpen, showZaps.isOpen, showReposts.isOpen, showReactions.isOpen]);

  const timeline = useNotificationTimeline();
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" wrap="wrap">
          <NotificationTypeToggles
            showReplies={showReplies}
            showMentions={showMentions}
            showZaps={showZaps}
            showReactions={showReactions}
            showReposts={showReposts}
          />
          <ButtonGroup>
            <PeopleListSelection flexShrink={0} />
            <Button as={RouterLink} to="/notifications/threads">
              Threads
            </Button>
          </ButtonGroup>
        </Flex>

        <NotificationsTimeline
          timeline={timeline}
          showReplies={showReplies.isOpen}
          showMentions={showMentions.isOpen}
          showZaps={showZaps.isOpen}
          showReposts={showReposts.isOpen}
          showReactions={showReactions.isOpen}
        />
        <TimelineActionAndStatus timeline={timeline} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function NotificationsView() {
  return (
    <RequireCurrentAccount>
      <PeopleListProvider initList="global">
        <NotificationsPage />
      </PeopleListProvider>
    </RequireCurrentAccount>
  );
}
