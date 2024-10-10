import { useCallback } from "react";
import { Flex } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { STEMSTR_RELAY, STEMSTR_TRACK_KIND } from "../../helpers/nostr/stemstr";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import TrackCard from "./components/track-card";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { NostrEvent } from "../../types/nostr-event";
import { AdditionalRelayProvider, useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { useReadRelays } from "../../hooks/use-client-relays";

function TracksPage() {
  const { listId, filter } = usePeopleListContext();
  const relays = useReadRelays(useAdditionalRelayContext());

  const clientMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (clientMuteFilter(event)) return false;
      return true;
    },
    [clientMuteFilter],
  );
  const { loader, timeline: tracks } = useTimelineLoader(
    `${listId}-tracks`,
    relays,
    filter && { kinds: [STEMSTR_TRACK_KIND], ...filter },
    {
      eventFilter,
    },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {tracks?.map((track) => <TrackCard key={track.id} track={track} />)}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function TracksView() {
  return (
    <PeopleListProvider>
      <AdditionalRelayProvider relays={[STEMSTR_RELAY]}>
        <TracksPage />
      </AdditionalRelayProvider>
    </PeopleListProvider>
  );
}
