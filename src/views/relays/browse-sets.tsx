import { Card, CardBody, CardHeader, Flex, Text } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { getEventUID } from "nostr-idb";

import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { NostrEvent } from "nostr-tools";
import { getListTitle, getRelaysFromList } from "../../helpers/nostr/lists";
import RelayFavicon from "../../components/relay/relay-favicon";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { useReadRelays } from "../../hooks/use-client-relays";

function RelaySetCard({ set }: { set: NostrEvent }) {
  const name = getListTitle(set);
  const relays = getRelaysFromList(set);

  return (
    <Card>
      <CardHeader p="4">{name}</CardHeader>
      <CardBody px="4" pb="4" pt="0" display="flex" flexDirection="row" gap="2" flexWrap="wrap">
        {relays.map((relay) => (
          <Text key={relay}>
            <RelayFavicon relay={relay} /> {relay}
          </Text>
        ))}
      </CardBody>
    </Card>
  );
}

function BrowseRelaySetsPage() {
  const relays = useReadRelays();
  const { filter } = usePeopleListContext();
  const { loader, timeline: relaySets } = useTimelineLoader(
    "relay-sets",
    relays,
    filter && { kinds: [kinds.Relaysets], ...filter },
    {
      eventFilter: (e) => getRelaysFromList(e).length > 0,
    },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {relaySets?.map((set) => (
          <RelaySetCard key={getEventUID(set)} set={set} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus loader={loader} />
    </VerticalPageLayout>
  );
}

export default function BrowseRelaySetsView() {
  return (
    <PeopleListProvider>
      <BrowseRelaySetsPage />
    </PeopleListProvider>
  );
}
