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
import { useNotifications } from "../../providers/global/notifications-provider";
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
import { NotificationType, typeSymbol } from "../../classes/notifications";

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
    day,
    showReplies,
    showMentions,
    showZaps,
    showReposts,
    showReactions,
  }: {
    day: string;
    showReplies: boolean;
    showMentions: boolean;
    showZaps: boolean;
    showReposts: boolean;
    showReactions: boolean;
  }) => {
    const { notifications } = useNotifications();
    const { people } = usePeopleListContext();
    const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);
    const minTimestamp = dayjs(day, DATE_FORMAT).startOf("day").unix();
    const maxTimestamp = dayjs(day, DATE_FORMAT).endOf("day").unix();

    const events = useSubject(notifications?.timeline) ?? [];

    const filteredEvents = useMemo(
      () =>
        events.filter((e) => {
          if (e.created_at < minTimestamp || e.created_at > maxTimestamp) return false;

          if (e[typeSymbol] === NotificationType.Zap) {
            if (!showZaps) return false;
            if (peoplePubkeys && !peoplePubkeys.includes(e.pubkey)) return false;
          }

          if (!showReplies && e[typeSymbol] === NotificationType.Reply) return false;
          if (!showMentions && e[typeSymbol] === NotificationType.Mention) return false;
          if (!showReactions && e[typeSymbol] === NotificationType.Reaction) return false;
          if (!showReposts && e[typeSymbol] === NotificationType.Repost) return false;
          if (!showZaps && e[typeSymbol] === NotificationType.Zap) return false;

          return true;
        }),
      [
        events,
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
  const { timeline } = useNotifications();

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
  const { value: day, setValue: setDay } = useRouteSearchValue(
    "date",
    timeline.timeline.value[0] ? dayjs.unix(timeline.timeline.value[0].created_at).format(DATE_FORMAT) : today,
  );

  const nextDay = () => {
    setDay((date) => {
      const endOfDay = dayjs(date ?? today, DATE_FORMAT)
        .endOf("day")
        .unix();

      // find the next event
      for (let i = timeline.timeline.value.length - 1; i > 0; i--) {
        const e = timeline.timeline.value[i];
        if (e.created_at > endOfDay) return dayjs.unix(e.created_at).format(DATE_FORMAT);
      }

      return dayjs(date ?? today, DATE_FORMAT)
        .add(1, "day")
        .format(DATE_FORMAT);
    });
  };
  const previousDay = () => {
    setDay((date) => {
      const startOfDay = dayjs(date ?? today, DATE_FORMAT).unix();

      // find the next event
      for (const e of timeline.timeline.value) {
        if (e.created_at < startOfDay) return dayjs.unix(e.created_at).format(DATE_FORMAT);
      }

      return dayjs(date ?? today, DATE_FORMAT)
        .subtract(1, "day")
        .format(DATE_FORMAT);
    });
  };

  // save toggles to localStorage when changed
  useEffect(() => {
    localStorage.setItem("notifications-show-replies", String(showReplies.isOpen));
    localStorage.setItem("notifications-show-mentions", String(showMentions.isOpen));
    localStorage.setItem("notifications-show-zaps", String(showZaps.isOpen));
    localStorage.setItem("notifications-show-reposts", String(showReposts.isOpen));
    localStorage.setItem("notifications-show-reactions", String(showReactions.isOpen));
  }, [showReplies.isOpen, showMentions.isOpen, showZaps.isOpen, showReposts.isOpen, showReactions.isOpen]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex direction={{ base: "column", lg: "row-reverse" }} gap="2" justifyContent="space-between">
        <Flex gap="2" justifyContent="space-between">
          <IconButton aria-label="Previous" icon={<ChevronLeftIcon boxSize={6} />} onClick={previousDay} />
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
        <Button leftIcon={<ChevronLeftIcon boxSize={6} />} onClick={previousDay}>
          Previous
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
