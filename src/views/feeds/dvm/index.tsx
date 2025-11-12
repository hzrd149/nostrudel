import { Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { AddressPointer, getAddressPointerForEvent, getEventUID, getReplaceableAddress } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-social-graph";
import { kinds } from "nostr-tools";
import { useMemo } from "react";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleNavBox from "../../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../../components/layout/presets/simple-view";
import Timestamp from "../../../components/timestamp";
import { DVM_CONTENT_DISCOVERY_JOB_KIND, isValidContentDVM } from "../../../helpers/nostr/dvm";
import { isEventInList } from "../../../helpers/nostr/lists";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useFavoriteFeeds from "../../../hooks/use-favorite-feeds";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import DVMAvatar from "./components/dvm-avatar";
import { DVMName } from "./components/dvm-name";

function DVMFeedRow({ dvm, ...props }: { dvm: NostrEvent }) {
  const metadata = JSON.parse(dvm.content);
  const pointer: AddressPointer = useMemo(() => getAddressPointerForEvent(dvm), [dvm]);

  const ref = useEventIntersectionRef(dvm);

  return (
    <SimpleNavBox
      ref={ref}
      icon={<DVMAvatar pointer={pointer} w="16" />}
      title={
        <Flex gap="2" align="center">
          <DVMName pointer={pointer} fontWeight="bold" fontSize="md" />
          <Text fontSize="sm" color="gray.500" ms="auto">
            Updated <Timestamp timestamp={dvm.created_at} />
          </Text>
        </Flex>
      }
      description={metadata.about}
      to={`/feeds/dvm/${getReplaceableAddress(dvm)}`}
      {...props}
    />
  );
}

export default function DVMFeedsView() {
  const readRelays = useReadRelays();
  const { loader, timeline: DVMs } = useTimelineLoader(
    "dvm-feeds",
    readRelays,
    {
      kinds: [kinds.Handlerinformation],
      "#k": [String(DVM_CONTENT_DISCOVERY_JOB_KIND)],
    },
    { eventFilter: isValidContentDVM },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  const { feeds: favoriteFeeds, favorites } = useFavoriteFeeds();

  return (
    <SimpleView title="DVM Feeds" flush>
      {favoriteFeeds.length > 0 && (
        <>
          <Heading size="lg" mt="4" mx="4">
            Favorites
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
            {favoriteFeeds.map((feed) => (
              <ErrorBoundary key={getEventUID(feed)} event={feed}>
                <DVMFeedRow dvm={feed} />
              </ErrorBoundary>
            ))}
          </SimpleGrid>
        </>
      )}

      <Heading size="lg" mt="4" mx="4">
        Other feeds
      </Heading>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
          {DVMs.filter((feed) => !favorites || !isEventInList(favorites, feed)).map((feed) => (
            <ErrorBoundary key={getEventUID(feed)} event={feed}>
              <DVMFeedRow dvm={feed} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </SimpleView>
  );
}
