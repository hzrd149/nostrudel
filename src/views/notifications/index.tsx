import { memo, ReactNode, useContext, useMemo } from "react";
import { BreadcrumbLink, Button, ButtonGroup, Divider, Flex, Switch, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import { useKeyPressEvent } from "react-use";

import RequireCurrentAccount from "../../providers/route/require-current-account";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotifications } from "../../providers/global/notifications-provider";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NotificationItem from "./components/notification-item";
import NotificationTypeToggles from "./notification-type-toggles";
import useLocalStorageDisclosure from "../../hooks/use-localstorage-disclosure";
import { NotificationType, typeSymbol } from "../../classes/notifications";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import FocusedContext from "./focused-context";
import useRouteStateValue from "../../hooks/use-route-state-value";
import readStatusService from "../../services/read-status";

// const DATE_FORMAT = "YYYY-MM-DD";

const NotificationsTimeline = memo(
  ({
    // day,
    showReplies,
    showMentions,
    showZaps,
    showReposts,
    showReactions,
  }: {
    // day: string;
    showReplies: boolean;
    showMentions: boolean;
    showZaps: boolean;
    showReposts: boolean;
    showReactions: boolean;
  }) => {
    const { notifications } = useNotifications();
    const { people } = usePeopleListContext();
    const { id: focused, focus: setFocus } = useContext(FocusedContext);
    const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);
    // const minTimestamp = dayjs(day, DATE_FORMAT).startOf("day").unix();
    // const maxTimestamp = dayjs(day, DATE_FORMAT).endOf("day").unix();

    const events = useSubject(notifications?.timeline) ?? [];

    const filteredEvents = useMemo(
      () =>
        events.filter((e) => {
          // if (e.created_at < minTimestamp || e.created_at > maxTimestamp) return false;

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
        // minTimestamp,
        // maxTimestamp,
      ],
    );

    // VIM controls
    const navigatePrev = () => {
      const focusedEvent = filteredEvents.find((e) => e.id === focused);

      if (focusedEvent) {
        const i = filteredEvents.indexOf(focusedEvent);
        if (i >= 1) {
          const prev = filteredEvents[i - 1];
          if (prev) setFocus(prev.id);
        }
      }
    };
    const navigateNext = () => {
      const focusedEvent = filteredEvents.find((e) => e.id === focused);

      const i = focusedEvent ? filteredEvents.indexOf(focusedEvent) : -1;
      if (i < filteredEvents.length - 2) {
        const next = filteredEvents[i + 1];
        if (next) setFocus(next.id);
      }
    };
    const navigateNextUnread = () => {
      const focusedEvent = filteredEvents.find((e) => e.id === focused);

      if (focusedEvent) {
        const idx = filteredEvents.indexOf(focusedEvent);
        for (let i = idx; i < filteredEvents.length; i++) {
          if (readStatusService.getStatus(filteredEvents[i].id).value === false) {
            setFocus(filteredEvents[i].id);
            break;
          }
        }
      }
    };
    useKeyPressEvent("ArrowUp", navigatePrev);
    useKeyPressEvent("ArrowDown", navigateNext);
    useKeyPressEvent("ArrowLeft", navigatePrev);
    useKeyPressEvent("ArrowRight", navigateNextUnread);
    useKeyPressEvent("k", navigatePrev);
    useKeyPressEvent("h", navigatePrev);
    useKeyPressEvent("j", navigateNext);
    useKeyPressEvent("l", navigateNextUnread);
    useKeyPressEvent("H", () => setFocus(filteredEvents[0]?.id ?? ""));
    useKeyPressEvent("L", () => setFocus(filteredEvents[filteredEvents.length - 1]?.id ?? ""));

    if (filteredEvents.length === 0)
      return (
        <Flex alignItems="center" justifyContent="center" minH="25vh" fontWeight="bold" fontSize="4xl">
          Nothing...
        </Flex>
      );

    const items: ReactNode[] = [];

    let prev = dayjs();
    for (const event of filteredEvents) {
      // insert markers at every day
      if (prev.diff(dayjs.unix(event.created_at), "d") > 0) {
        prev = dayjs.unix(event.created_at);

        items.push(
          <Flex gap="4" p="2" key={prev.unix() + "-marker"} alignItems="center">
            <Divider />
            <Text whiteSpace="pre">{prev.fromNow()}</Text>
            <Divider />
          </Flex>,
        );
      }

      items.push(<NotificationItem key={event.id} event={event} />);
    }

    return <>{items}</>;
  },
);

function NotificationsPage() {
  const { timeline } = useNotifications();

  const { value: focused, setValue: setFocused } = useRouteStateValue("focused", "");
  const focusContext = useMemo(() => ({ id: focused, focus: setFocused }), [focused, setFocused]);

  const showReplies = useLocalStorageDisclosure("notifications-show-replies", true);
  const showMentions = useLocalStorageDisclosure("notifications-show-mentions", true);
  const showZaps = useLocalStorageDisclosure("notifications-show-zaps", true);
  const showReposts = useLocalStorageDisclosure("notifications-show-reposts", true);
  const showReactions = useLocalStorageDisclosure("notifications-show-reactions", true);

  // const today = dayjs().format(DATE_FORMAT);
  // const { value: day, setValue: setDay } = useRouteSearchValue(
  //   "date",
  //   timeline.timeline.value[0] ? dayjs.unix(timeline.timeline.value[0].created_at).format(DATE_FORMAT) : today,
  // );

  // const nextDay = () => {
  //   setDay((date) => {
  //     const endOfDay = dayjs(date ?? today, DATE_FORMAT)
  //       .endOf("day")
  //       .unix();

  //     // find the next event
  //     for (let i = timeline.timeline.value.length - 1; i > 0; i--) {
  //       const e = timeline.timeline.value[i];
  //       if (e.created_at > endOfDay) return dayjs.unix(e.created_at).format(DATE_FORMAT);
  //     }

  //     return dayjs(date ?? today, DATE_FORMAT)
  //       .add(1, "day")
  //       .format(DATE_FORMAT);
  //   });
  // };
  // const previousDay = () => {
  //   setDay((date) => {
  //     const startOfDay = dayjs(date ?? today, DATE_FORMAT).unix();

  //     // find the next event
  //     for (const e of timeline.timeline.value) {
  //       if (e.created_at < startOfDay) return dayjs.unix(e.created_at).format(DATE_FORMAT);
  //     }

  //     return dayjs(date ?? today, DATE_FORMAT)
  //       .subtract(1, "day")
  //       .format(DATE_FORMAT);
  //   });
  // };

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex direction={{ base: "column", lg: "row-reverse" }} gap="2" justifyContent="space-between">
        {/* <Flex gap="2" justifyContent="space-between">
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
        </Flex> */}

        <Flex gap="2" wrap="wrap" flex={1} alignItems="center">
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
        <FocusedContext.Provider value={focusContext}>
          <Flex direction="column">
            <NotificationsTimeline
              // day={day}
              showReplies={showReplies.isOpen}
              showMentions={showMentions.isOpen}
              showZaps={showZaps.isOpen}
              showReposts={showReposts.isOpen}
              showReactions={showReactions.isOpen}
            />
          </Flex>
        </FocusedContext.Provider>
      </IntersectionObserverProvider>

      <TimelineActionAndStatus timeline={timeline} />

      {/* <ButtonGroup mx="auto" mt="4">
        <Button leftIcon={<ChevronLeftIcon boxSize={6} />} onClick={previousDay}>
          Previous
        </Button>
        {day !== today && (
          <Button rightIcon={<ChevronRightIcon boxSize={6} />} onClick={nextDay}>
            Next
          </Button>
        )}
      </ButtonGroup> */}
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
