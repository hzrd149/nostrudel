import { useEffect, useMemo, useRef } from "react";
import { Divider, Flex, Heading, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import RequireCurrentAccount from "../../providers/require-current-account";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotificationTimeline } from "../../providers/notification-timeline";
import { getEventUID, isReply } from "../../helpers/nostr/events";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NotificationItem, { ExpandableToggleButton } from "./notification-item";
import NotificationTypeToggles from "./notification-type-toggles";
import { NostrEvent } from "../../types/nostr-event";
import dayjs from "dayjs";
import SuperMap from "../../classes/super-map";

const specialNames = {
  [dayjs().startOf("day").unix()]: "Today",
  [dayjs().subtract(1, "day").startOf("day").unix()]: "Yesterday",
};

function NotificationDay({ day, events }: { day: number; events: NostrEvent[] }) {
  const expanded = useDisclosure({ defaultIsOpen: true });
  const now = dayjs();
  const date = dayjs.unix(day);
  let title = specialNames[day] || date.fromNow();
  if (now.diff(date, "week") > 2) {
    title = date.format("L");
  }

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, expanded.isOpen ? undefined : getEventUID(events[events.length - 1]));

  return (
    <>
      <Flex gap="4" alignItems="center" mt="4" ref={ref}>
        <Divider w="10" flexShrink={0} />
        <Heading size="lg" whiteSpace="nowrap">
          {title}
        </Heading>
        <Divider />
        <ExpandableToggleButton toggle={expanded} aria-label="Toggle day" title="Toggle day" />
      </Flex>
      {expanded.isOpen && events.map((event) => <NotificationItem key={event.id} event={event} />)}
    </>
  );
}

function NotificationsPage() {
  const { people } = usePeopleListContext();
  const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

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
  const events = useSubject(timeline?.timeline).filter((e) => {
    if (peoplePubkeys && e.kind !== Kind.Zap && !peoplePubkeys.includes(e.pubkey)) return false;

    if (e.kind === Kind.Text) {
      if (!showReplies.isOpen && isReply(e)) return false;
      if (!showMentions.isOpen && !isReply(e)) return false;
    }
    if (!showReactions.isOpen && e.kind === Kind.Reaction) return false;
    if (!showReposts.isOpen && e.kind === Kind.Repost) return false;
    if (!showZaps.isOpen && e.kind === Kind.Zap) return false;

    return true;
  });

  const grouped = useMemo(() => {
    const map = new SuperMap<number, NostrEvent[]>(() => []);
    for (const event of events) {
      const day = dayjs.unix(event.created_at).startOf("day").unix();
      map.get(day).push(event);
    }
    return map;
  }, [events]);

  const sortedDays = Array.from(grouped.entries()).sort((a, b) => b[0] - a[0]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2">
          <NotificationTypeToggles
            showReplies={showReplies}
            showMentions={showMentions}
            showZaps={showZaps}
            showReactions={showReactions}
            showReposts={showReposts}
          />
          <PeopleListSelection flexShrink={0} />
        </Flex>

        {sortedDays.map(([day, events]) => (
          <NotificationDay key={day} day={day} events={events} />
        ))}
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
