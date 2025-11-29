import { Flex, Switch } from "@chakra-ui/react";
import { useEventModel, useObservableState } from "applesauce-react/hooks";
import { Filter, kinds } from "nostr-tools";
import { useMemo } from "react";
import { NEVER } from "rxjs";
import { unixNow } from "applesauce-core/helpers";
import { shareAndHold } from "../../helpers/observable";

import SimpleView from "../../components/layout/presets/simple-view";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import LoadMoreButton from "../../components/timeline/load-more-button";
import { useAppTitle } from "../../hooks/use-app-title";
import { useRouteStateBoolean } from "../../hooks/use-route-state-value";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useOutboxTimelineLoader } from "../../hooks/use-outbox-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { OutboxSelectionModel } from "../../models/outbox-selection";
import outboxSubscriptionsService from "../../services/outbox-subscriptions";
import EndedStreamsSection from "./components/sections/ended-streams-section";
import FavoritesStreamsSection from "./components/sections/favorites-streams-section";
import LiveStreamsSection from "./components/sections/live-streams-section";

function StreamsPage() {
  useAppTitle("Streams");
  const showEnded = useRouteStateBoolean("ended", false);

  const { filter, pointer } = usePeopleListContext();
  const { selection, outboxes } = useEventModel(OutboxSelectionModel, pointer ? [pointer] : undefined) ?? {};

  // For outbox timeline loader, only include #p tags (authors are added automatically by outbox system)
  const outboxFilter = useMemo(() => {
    if (!filter) return undefined;
    const { authors, ...rest } = filter;
    return {
      ...rest,
      kinds: [kinds.LiveEvent],
      "#p": authors,
    };
  }, [filter]);

  const loader = useOutboxTimelineLoader(pointer, outboxFilter);

  // Create the subscription observable with shareAndHold to keep it open for a bit
  const subscription$ = useMemo(() => {
    if (!pointer || !outboxFilter) return NEVER;
    const subscriptionFilter = { ...outboxFilter, since: unixNow() - 60 };
    return outboxSubscriptionsService.subscription(pointer, subscriptionFilter).pipe(shareAndHold(60_000)); // Keep subscription alive for 60 seconds after last unsubscribe
  }, [pointer, outboxFilter]);

  // Subscribe to live events from outboxes
  useObservableState(subscription$);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <SimpleView
      title="Streams"
      actions={
        <Flex gap="2" wrap="wrap" alignItems="center">
          <PeopleListSelection size="sm" />
          <Switch isChecked={showEnded.isOpen} onChange={showEnded.onToggle}>
            Show Ended
          </Switch>
        </Flex>
      }
    >
      <IntersectionObserverProvider callback={callback}>
        <FavoritesStreamsSection />
        <LiveStreamsSection filter={filter} />
        {showEnded.isOpen && <EndedStreamsSection filter={filter} />}
        <LoadMoreButton loader={loader} />
      </IntersectionObserverProvider>
    </SimpleView>
  );
}
export default function StreamHomeView() {
  return (
    <PeopleListProvider>
      <StreamsPage />
    </PeopleListProvider>
  );
}
