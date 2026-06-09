import { Button, Flex, Spacer } from "@chakra-ui/react";
import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";
import { map, NEVER, of, throttleTime } from "rxjs";
import { unixNow } from "applesauce-core/helpers";

import { AddIcon } from "../../components/icons";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import RouterLink from "../../components/router-link";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import { shareAndHold } from "../../helpers/observable";
import { POLL_KIND } from "../../helpers/nostr/polls";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useOutboxTimelineLoader } from "../../hooks/use-outbox-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { eventStore } from "../../services/event-store";
import outboxSubscriptionsService from "../../services/outbox-subscriptions";

function PollHomePage() {
  const timelinePageEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      return timelinePageEventFilter(event);
    },
    [timelinePageEventFilter, muteFilter],
  );

  const { filter, pointer } = usePeopleListContext();

  // Get or create the outbox timeline loader
  const loader = useOutboxTimelineLoader(pointer, filter && { ...filter, kinds: [POLL_KIND] });

  // Create the subscription observable with shareAndHold to keep it open for a bit
  const subscription$ = useMemo(() => {
    if (!pointer || !filter) return NEVER;
    const subscriptionFilter = { ...filter, kinds: [POLL_KIND], since: unixNow() - 60 };
    return outboxSubscriptionsService.subscription(pointer, subscriptionFilter).pipe(shareAndHold(60_000));
  }, [pointer, filter]);

  // Subscribe to live events from outboxes
  use$(subscription$);

  // Subscribe to event store for timeline events
  const timeline =
    use$(
      () =>
        filter
          ? eventStore.timeline({ ...filter, kinds: [POLL_KIND] }).pipe(
              throttleTime(500),
              map((events) => events.filter(eventFilter)),
            )
          : of([]),
      [filter, eventFilter],
    ) ?? [];

  const header = (
    <Flex gap="2" wrap="wrap" alignItems="center">
      <PeopleListSelection />
      <Spacer />
      <Button as={RouterLink} to="/new/poll" colorScheme="primary" leftIcon={<AddIcon boxSize={5} />}>
        New Poll
      </Button>
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" maxW="6xl" />;
}

export default function PollHomeView() {
  const account = useActiveAccount();

  if (!account)
    return (
      <Flex justifyContent="center" pt="2" px="2">
        <Button as={RouterLink} to="/new/poll" colorScheme="primary" leftIcon={<AddIcon boxSize={5} />}>
          New Poll
        </Button>
      </Flex>
    );

  return (
    <PeopleListProvider>
      <PollHomePage />
    </PeopleListProvider>
  );
}
