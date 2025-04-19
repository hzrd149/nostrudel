import { SimpleGrid } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { useCallback } from "react";

import { ErrorBoundary } from "../../components/error-boundary";
import ContainedSimpleView from "../../components/layout/presets/contained-simple-view";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { NostrEvent } from "nostr-tools";
import ChannelCard from "./components/channel-card";

function ChannelsExplorePage() {
  const relays = useReadRelays();
  const { filter, listId } = usePeopleListContext();

  const clientMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (clientMuteFilter(e)) return false;
      return true;
    },
    [clientMuteFilter],
  );
  const { loader, timeline: channels } = useTimelineLoader(
    `${listId}-channels`,
    relays,
    filter ? { ...filter, kinds: [kinds.ChannelCreation] } : undefined,
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ContainedSimpleView title="Explore channels" actions={<PeopleListSelection ms="auto" size="sm" />}>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, xl: 2, "2xl": 3 }} spacing="2">
          {channels?.map((channel) => (
            <ErrorBoundary key={channel.id}>
              <ChannelCard channel={channel} additionalRelays={relays} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </ContainedSimpleView>
  );
}

export default function ChannelsExploreView() {
  return (
    <PeopleListProvider>
      <ChannelsExplorePage />
    </PeopleListProvider>
  );
}
