import { useCallback } from "react";
import { Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { MEDIA_POST_KIND } from "../../helpers/nostr/media";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import TimelinePage from "../../components/timeline-page";

function MediaFeedPage() {
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      return true;
    },
    [muteFilter],
  );

  const relays = useReadRelays();
  const { listId, filter } = usePeopleListContext();

  const { loader, timeline } = useTimelineLoader(
    `${listId}-media-feed`,
    relays,
    filter ? { ...filter, kinds: [MEDIA_POST_KIND] } : undefined,
    {
      eventFilter,
    },
  );

  const header = (
    <Flex gap="2" wrap="wrap" alignItems="center">
      <PeopleListSelection />
    </Flex>
  );

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" />;
}

export default function MediaFeedView() {
  return (
    <PeopleListProvider>
      <MediaFeedPage />
    </PeopleListProvider>
  );
}
