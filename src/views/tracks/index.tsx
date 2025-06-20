import { Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { STEMSTR_RELAY, STEMSTR_TRACK_KIND } from "../../helpers/nostr/stemstr";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { AdditionalRelayProvider, useAdditionalRelayContext } from "../../providers/local/additional-relay";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import TrackCard from "./components/track-card";

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
