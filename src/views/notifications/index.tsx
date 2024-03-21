import { memo, useEffect, useMemo, useRef } from "react";
import { Button, ButtonGroup, Flex, IconButton, Input, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import { useThrottle } from "react-use";

import RequireCurrentAccount from "../../providers/route/require-current-account";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotificationTimeline } from "../../providers/global/notification-timeline";
import { getEventUID, isReply } from "../../helpers/nostr/event";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NotificationItem from "./components/notification-item";
import NotificationTypeToggles from "./notification-type-toggles";
import { NostrEvent } from "../../types/nostr-event";
import { groupByTime } from "../../helpers/notification";
import DayGroup from "./components/day-group";
import TimelineLoader from "../../classes/timeline-loader";
import { ChevronLeftIcon, ChevronRightIcon } from "../../components/icons";
import useRouteSearchValue from "../../hooks/use-route-search-value";

const DATE_FORMAT = "YYYY-MM-DD";

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
    day,
    showReplies,
    showMentions,
    showZaps,
    showReposts,
    showReactions,
  }: {
    timeline: TimelineLoader;
    day: string;
    showReplies: boolean;
    showMentions: boolean;
    showZaps: boolean;
    showReposts: boolean;
    showReactions: boolean;
  }) => {
    const { people } = usePeopleListContext();
    const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);
    const minTimestamp = dayjs(day, DATE_FORMAT).startOf("day").unix();
    const maxTimestamp = dayjs(day, DATE_FORMAT).endOf("day").unix();

    const events = useSubject(timeline.timeline);

    const throttledEvents = useThrottle(events, 500);
    const filteredEvents = useMemo(
      () =>
        throttledEvents.filter((e) => {
          if (e.created_at < minTimestamp || e.created_at > maxTimestamp) return false;
          if (peoplePubkeys && e.kind !== kinds.Zap && !peoplePubkeys.includes(e.pubkey)) return false;

          if (e.kind === kinds.ShortTextNote) {
            if (!showReplies && isReply(e)) return false;
            if (!showMentions && !isReply(e)) return false;
          }
          if (!showReactions && e.kind === kinds.Reaction) return false;
          if (!showReposts && (e.kind === kinds.Repost || e.kind === kinds.GenericRepost)) return false;
          if (!showZaps && e.kind === kinds.Zap) return false;

          return true;
        }),
      [
        throttledEvents,
        peoplePubkeys,
        showReplies,
        showMentions,
        showReactions,
        showReposts,
        showZaps,
        minTimestamp,
        maxTimestamp,
      ],
    );
    // const sortedDays = useMemo(() => groupByTime(filteredEvents), [filteredEvents]);

    if (filteredEvents.length === 0)
      return (
        <Flex alignItems="center" justifyContent="center" minH="25vh" fontWeight="bold" fontSize="4xl">
          Nothing...
        </Flex>
      );

    return (
      <>
        {filteredEvents.map((event) => (
          <NotificationItem key={event.id} event={event} />
        ))}
      </>
    );

    // return (
    //   <>
    //     {sortedDays.map(([day, events]) => (
    //       <NotificationDay key={day} day={day} events={events} />
    //     ))}
    //   </>
    // );
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

  const today = dayjs().format(DATE_FORMAT);
  const { value: day, setValue: setDay } = useRouteSearchValue("date", dayjs().format(DATE_FORMAT));

  const nextDay = () => {
    setDay((date) =>
      dayjs(date ?? today, DATE_FORMAT)
        .add(1, "day")
        .format(DATE_FORMAT),
    );
  };
  const perviousDay = () => {
    setDay((date) =>
      dayjs(date ?? today, DATE_FORMAT)
        .subtract(1, "day")
        .format(DATE_FORMAT),
    );
  };

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
    <VerticalPageLayout>
      <Flex direction={{ base: "column", lg: "row-reverse" }} gap="2" justifyContent="space-between">
        <Flex gap="2" justifyContent="space-between">
          <IconButton aria-label="Pervious" icon={<ChevronLeftIcon boxSize={6} />} onClick={perviousDay} />
          <Input
            maxW="xs"
            minW="64"
            type="date"
            value={day}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            max={today}
          />
          <IconButton
            aria-label="Next"
            icon={<ChevronRightIcon boxSize={6} />}
            onClick={nextDay}
            isDisabled={day === today}
          />
        </Flex>

        <Flex gap="2" wrap="wrap" flex={1}>
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
      </Flex>

      <IntersectionObserverProvider callback={callback}>
        <NotificationsTimeline
          timeline={timeline}
          day={day}
          showReplies={showReplies.isOpen}
          showMentions={showMentions.isOpen}
          showZaps={showZaps.isOpen}
          showReposts={showReposts.isOpen}
          showReactions={showReactions.isOpen}
        />
      </IntersectionObserverProvider>

      {/* <TimelineActionAndStatus timeline={timeline} /> */}

      <ButtonGroup mx="auto" mt="4">
        <Button leftIcon={<ChevronLeftIcon boxSize={6} />} onClick={perviousDay}>
          Pervious
        </Button>
        {day !== today && (
          <Button rightIcon={<ChevronRightIcon boxSize={6} />} onClick={nextDay}>
            Next
          </Button>
        )}
      </ButtonGroup>
    </VerticalPageLayout>
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
