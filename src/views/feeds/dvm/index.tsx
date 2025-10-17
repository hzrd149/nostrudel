import { Flex, Heading, SimpleGrid } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import { DVM_CONTENT_DISCOVERY_JOB_KIND, isValidContentDVM } from "../../../helpers/nostr/dvm";
import { isEventInList } from "../../../helpers/nostr/lists";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useFavoriteFeeds from "../../../hooks/use-favorite-feeds";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import DVMFeedRow from "./components/dvm-feed-row";

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
          <Flex direction="column" borderTopWidth={1}>
            {favoriteFeeds.map((feed) => (
              <ErrorBoundary key={getEventUID(feed)} event={feed}>
                <DVMFeedRow dvm={feed} />
              </ErrorBoundary>
            ))}
          </Flex>
        </>
      )}

      <Heading size="lg" mt="4" mx="4">
        Other feeds
      </Heading>
      <Flex direction="column" borderTopWidth={1}>
        <IntersectionObserverProvider callback={callback}>
          {DVMs.filter((feed) => !favorites || !isEventInList(favorites, feed)).map((feed) => (
            <ErrorBoundary key={getEventUID(feed)} event={feed}>
              <DVMFeedRow dvm={feed} />
            </ErrorBoundary>
          ))}
        </IntersectionObserverProvider>
      </Flex>
    </SimpleView>
  );
}
