import { memo, ReactNode, useCallback, useMemo } from "react";
import { Button, ButtonGroup, Divider, Flex, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { getEventUID } from "nostr-idb";

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
import { CategorizedEvent, NotificationType, typeSymbol } from "../../classes/notifications";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import FocusedContext from "./focused-context";
import readStatusService from "../../services/read-status";
import useTimelineLocationCacheKey from "../../hooks/timeline/use-timeline-cache-key";
import useNumberCache from "../../hooks/timeline/use-number-cache";
import { useTimelineDates } from "../../hooks/timeline/use-timeline-dates";
import useCacheEntryHeight from "../../hooks/timeline/use-cache-entry-height";
import useVimNavigation from "./use-vim-navigation";
import { PersistentSubject } from "../../classes/subject";
import { useObservable } from "../../hooks/use-observable";

function TimeMarker({ date, ids }: { date: Dayjs; ids: string[] }) {
  const readAll = useCallback(() => {
    for (const id of ids) readStatusService.setRead(id);
  }, [ids]);

  return (
    <Flex gap="4" p="2" key={date.unix() + "-marker"} alignItems="center">
      <Divider />
      <Text whiteSpace="pre">{date.fromNow()}</Text>
      <Divider />
      <Button variant="link" ml="2" onClick={readAll} flexShrink={0}>
        Mark Read
      </Button>
    </Flex>
  );
}

const NotificationsTimeline = memo(
  ({
    showReplies,
    showMentions,
    showZaps,
    showReposts,
    showReactions,
  }: {
    showReplies: boolean;
    showMentions: boolean;
    showZaps: boolean;
    showReposts: boolean;
    showReactions: boolean;
  }) => {
    const { notifications } = useNotifications();
    const { people } = usePeopleListContext();
    const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

    const events = useObservable(notifications?.timeline) ?? [];

    const cacheKey = useTimelineLocationCacheKey();
    const numberCache = useNumberCache(cacheKey);

    const minItems = Math.round(window.innerHeight / 48) * 2;
    const dates = useTimelineDates(events, numberCache, minItems / 2, minItems);

    // measure and cache the hight of every entry
    useCacheEntryHeight(numberCache.set);

    const filtered: CategorizedEvent[] = [];
    for (const event of events) {
      if (event.created_at < dates.cursor && filtered.length > minItems) continue;

      const type = event[typeSymbol];
      if (type === NotificationType.Zap) {
        if (!showZaps) continue;
        if (peoplePubkeys && !peoplePubkeys.includes(event.pubkey)) continue;
      }

      if (!showReplies && type === NotificationType.Reply) continue;
      if (!showMentions && type === NotificationType.Mention) continue;
      if (!showReactions && type === NotificationType.Reaction) continue;
      if (!showReposts && type === NotificationType.Repost) continue;
      if (!showZaps && type === NotificationType.Zap) continue;

      filtered.push(event);
    }

    // VIM controls
    useVimNavigation(filtered);

    if (filtered.length === 0)
      return (
        <Flex alignItems="center" justifyContent="center" minH="25vh" fontWeight="bold" fontSize="4xl">
          Loading...
        </Flex>
      );

    const items: ReactNode[] = [];

    let prev = dayjs();
    let ids: string[] = [];
    for (const event of filtered) {
      // insert markers at every day
      if (prev.diff(dayjs.unix(event.created_at), "d") > 0) {
        prev = dayjs.unix(event.created_at);

        ids = [];
        items.push(<TimeMarker key={prev.unix() + "-marker"} date={prev} ids={ids} />);
      }

      const visible = event.created_at <= dates.max && event.created_at >= dates.min;
      ids.push(event.id);
      items.push(
        <NotificationItem
          key={event.id}
          event={event}
          visible={visible}
          minHeight={visible ? undefined : numberCache.get(getEventUID(event)) + "px"}
        />,
      );
    }

    return <>{items}</>;
  },
);

const cachedFocus = new PersistentSubject("");

function NotificationsPage() {
  const { timeline } = useNotifications();

  // const { value: focused, setValue: setFocused } = useRouteStateValue("focused", "");
  // const [focused, setFocused] = useState("");
  const focused = useSubject(cachedFocus);
  const setFocused = useCallback((id: string) => cachedFocus.next(id), [cachedFocus]);
  const focusContext = useMemo(() => ({ id: focused, focus: setFocused }), [focused, setFocused]);

  const showReplies = useLocalStorageDisclosure("notifications-show-replies", true);
  const showMentions = useLocalStorageDisclosure("notifications-show-mentions", true);
  const showZaps = useLocalStorageDisclosure("notifications-show-zaps", true);
  const showReposts = useLocalStorageDisclosure("notifications-show-reposts", true);
  const showReactions = useLocalStorageDisclosure("notifications-show-reactions", true);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex direction={{ base: "column", lg: "row-reverse" }} gap="2" justifyContent="space-between">
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
          <Flex direction="column" overflow="hidden">
            <NotificationsTimeline
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
