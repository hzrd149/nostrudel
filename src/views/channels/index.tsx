import { useCallback } from "react";
import { kinds } from "nostr-tools";
import { Flex } from "@chakra-ui/react";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import VerticalPageLayout from "../../components/vertical-page-layout";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { NostrEvent } from "../../types/nostr-event";
import { ErrorBoundary } from "../../components/error-boundary";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import ChannelCard from "./components/channel-card";
import { useReadRelays } from "../../hooks/use-client-relays";

function ChannelsHomePage() {
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
  const timeline = useTimelineLoader(
    `${listId}-channels`,
    relays,
    filter ? { ...filter, kinds: [kinds.ChannelCreation] } : undefined,
    { eventFilter },
  );
  const channels = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {channels.map((channel) => (
          <ErrorBoundary key={channel.id}>
            <ChannelCard channel={channel} additionalRelays={relays} />
          </ErrorBoundary>
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function ChannelsHomeView() {
  return (
    <PeopleListProvider>
      <ChannelsHomePage />
    </PeopleListProvider>
  );
}
