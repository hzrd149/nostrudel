import { Box, Flex, Switch, Text } from "@chakra-ui/react";
import { mapEventsToStore } from "applesauce-core";
import { unixNow } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useMemo } from "react";
import { NEVER } from "rxjs";

import SimpleView from "../../components/layout/presets/simple-view";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { useAppTitle } from "../../hooks/use-app-title";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useRouteStateBoolean } from "../../hooks/use-route-state-value";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { eventStore } from "../../services/event-store";
import pool from "../../services/pool";
import FavoritesStreamsSection from "./components/sections/favorites-streams-section";
import StreamsSection from "./components/sections/streams-section";

// Streams older than this are not interesting for the homepage; the helpers also
// auto-classify anything older than two weeks as "ended", so a 7-day window is plenty
// to capture currently live and recently-planned streams.
const STREAMS_LOOKBACK_SECONDS = 7 * 24 * 60 * 60;

function StreamsPage() {
  useAppTitle("Streams");
  const showEnded = useRouteStateBoolean("ended", false);

  const { filter, pointer } = usePeopleListContext();
  const readRelays = useReadRelays(["wss://relay.snort.social"]);

  const filters = useMemo(() => {
    if (!filter) return undefined;
    const { authors, ...rest } = filter;
    return [
      {
        ...rest,
        kinds: [kinds.LiveEvent],
        "#p": authors,
        since: unixNow() - STREAMS_LOOKBACK_SECONDS,
      },
      {
        ...rest,
        kinds: [kinds.LiveEvent],
        authors: authors,
        since: unixNow() - STREAMS_LOOKBACK_SECONDS,
      },
    ];
  }, [filter]);

  // Open a single live subscription for the page. The outbox service routes
  // each author's events to the relays they actually publish on. Events flow
  // into the shared event store and the section components react via
  // `eventStore.timeline()`.
  const subscription$ = useMemo(() => {
    if (!pointer || !filters) return NEVER;
    return pool.subscription(readRelays, filters).pipe(mapEventsToStore(eventStore));
  }, [pointer, filters, readRelays]);

  use$(subscription$);

  return (
    <SimpleView
      title="Streams"
      actions={
        <Flex gap="2" wrap="wrap" alignItems="center">
          <PeopleListSelection size="sm" />
          <Switch isChecked={showEnded.isOpen} onChange={showEnded.onToggle}>
            Ended
          </Switch>
        </Flex>
      }
    >
      <FavoritesStreamsSection />
      <StreamsSection
        title="Live"
        status="live"
        filter={filter}
        emptyState={
          !filter ? null : (
            <Box mt="2">
              <Text color="GrayText">
                No live streams from the selected people right now. New streams will appear here automatically.
              </Text>
            </Box>
          )
        }
      />
      <StreamsSection title="Planned" status="planned" filter={filter} mt="4" />
      {showEnded.isOpen && <StreamsSection title="Ended" status="ended" filter={filter} mt="4" />}
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
