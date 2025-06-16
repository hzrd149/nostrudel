import { memo, ReactNode, useCallback, useMemo } from "react";
import { Button, Divider, Flex, Text } from "@chakra-ui/react";
import dayjs, { Dayjs } from "dayjs";
import { getEventUID } from "nostr-idb";
import { BehaviorSubject } from "rxjs";
import { useActiveAccount, useObservable, useObservableEagerState } from "applesauce-react/hooks";
import { COMMENT_KIND } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import RequireActiveAccount from "../../components/router/require-active-account";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import NotificationItem from "./components/notification-item";
import NotificationTypeToggles from "./notification-type-toggles";
import useLocalStorageDisclosure from "../../hooks/use-localstorage-disclosure";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import FocusedContext from "./focused-context";
import readStatusService from "../../services/read-status";
import useTimelineLocationCacheKey from "../../hooks/timeline/use-timeline-cache-key";
import useNumberCache from "../../hooks/timeline/use-number-cache";
import { useTimelineDates } from "../../hooks/timeline/use-timeline-dates";
import useCacheEntryHeight from "../../hooks/timeline/use-cache-entry-height";
import useVimNavigation from "./use-vim-navigation";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { truncateId } from "../../helpers/string";
import { useReadRelays } from "../../hooks/use-client-relays";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import notifications$, {
  CategorizedEvent,
  NotificationType,
  NotificationTypeSymbol,
} from "../../services/notifications";

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
    showQuotes,
    showZaps,
    showReposts,
    showReactions,
    showUnknown,
  }: {
    showReplies: boolean;
    showMentions: boolean;
    showQuotes: boolean;
    showZaps: boolean;
    showReposts: boolean;
    showReactions: boolean;
    showUnknown: boolean;
  }) => {
    const { people } = usePeopleListContext();
    const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

    const timeline = useObservableEagerState(notifications$) ?? [];

    const cacheKey = useTimelineLocationCacheKey();
    const numberCache = useNumberCache(cacheKey);

    const minItems = Math.round(window.innerHeight / 48) * 2;
    const dates = useTimelineDates(timeline, numberCache, minItems / 2, minItems);

    // measure and cache the hight of every entry
    useCacheEntryHeight(numberCache.set);

    const filtered: CategorizedEvent[] = [];
    for (const event of timeline) {
      if (event.created_at < dates.cursor && filtered.length > minItems) continue;

      const type = event[NotificationTypeSymbol];

      switch (type) {
        case NotificationType.Zap:
          if (!showZaps) continue;
          if (peoplePubkeys && !peoplePubkeys.includes(event.pubkey)) continue;
          break;

        case NotificationType.Reply:
          if (!showReplies) continue;
          break;

        case NotificationType.Quote:
          if (!showQuotes) continue;
          break;

        case NotificationType.Mention:
          if (!showMentions) continue;
          break;

        case NotificationType.Reaction:
          if (!showReactions) continue;
          break;

        case NotificationType.Repost:
          if (!showReposts) continue;
          break;

        default:
          if (!showUnknown) continue;
          break;
      }

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

const cachedFocus = new BehaviorSubject("");

function NotificationsPage() {
  const account = useActiveAccount();

  const mailboxes = useUserMailboxes(account?.pubkey);
  const readRelays = useReadRelays(mailboxes?.inboxes);
  const { loader } = useTimelineLoader(
    `${truncateId(account?.pubkey ?? "anon")}-notification`,
    readRelays,
    account?.pubkey
      ? {
          "#p": [account.pubkey],
          kinds: [
            kinds.ShortTextNote,
            kinds.Repost,
            kinds.GenericRepost,
            kinds.Reaction,
            kinds.Zap,
            kinds.LongFormArticle,
            COMMENT_KIND,
          ],
        }
      : undefined,
  );

  // const { value: focused, setValue: setFocused } = useRouteStateValue("focused", "");
  // const [focused, setFocused] = useState("");
  const focused = useObservableEagerState(cachedFocus);
  const setFocused = useCallback((id: string) => cachedFocus.next(id), [cachedFocus]);
  const focusContext = useMemo(() => ({ id: focused, focus: setFocused }), [focused, setFocused]);

  const showReplies = useLocalStorageDisclosure("notifications-show-replies", true);
  const showMentions = useLocalStorageDisclosure("notifications-show-mentions", true);
  const showQuotes = useLocalStorageDisclosure("notifications-show-quotes", true);
  const showZaps = useLocalStorageDisclosure("notifications-show-zaps", true);
  const showReposts = useLocalStorageDisclosure("notifications-show-reposts", true);
  const showReactions = useLocalStorageDisclosure("notifications-show-reactions", false);
  const showUnknown = useLocalStorageDisclosure("notifications-show-unknown", false);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex direction={{ base: "column", lg: "row-reverse" }} gap="2" justifyContent="space-between">
        <Flex gap="2" wrap="wrap" flex={1} alignItems="center">
          <NotificationTypeToggles
            showReplies={showReplies}
            showMentions={showMentions}
            showQuotes={showQuotes}
            showZaps={showZaps}
            showReactions={showReactions}
            showReposts={showReposts}
            showUnknown={showUnknown}
          />
          <PeopleListSelection flexShrink={0} />
        </Flex>
      </Flex>

      <IntersectionObserverProvider callback={callback}>
        <FocusedContext.Provider value={focusContext}>
          <Flex direction="column" overflow="hidden">
            <NotificationsTimeline
              showReplies={showReplies.isOpen}
              showMentions={showMentions.isOpen}
              showQuotes={showQuotes.isOpen}
              showZaps={showZaps.isOpen}
              showReposts={showReposts.isOpen}
              showReactions={showReactions.isOpen}
              showUnknown={showUnknown.isOpen}
            />
          </Flex>
        </FocusedContext.Provider>
      </IntersectionObserverProvider>

      <TimelineActionAndStatus loader={loader} />
    </VerticalPageLayout>
  );
}

export default function NotificationsView() {
  return (
    <RequireActiveAccount>
      <PeopleListProvider initList="global">
        <NotificationsPage />
      </PeopleListProvider>
    </RequireActiveAccount>
  );
}
