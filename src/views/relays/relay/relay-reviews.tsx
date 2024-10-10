import { Flex } from "@chakra-ui/react";

import { RELAY_REVIEW_LABEL } from "../../../helpers/nostr/reviews";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import RelayReviewNote from "../components/relay-review-note";
import { useAppTitle } from "../../../hooks/use-app-title";
import { usePeopleListContext } from "../../../providers/local/people-list-provider";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

export default function RelayReviews({ relay }: { relay: string }) {
  useAppTitle(`${relay} - Reviews`);
  const readRelays = useReadRelays();

  const { filter } = usePeopleListContext();
  const { loader, timeline: reviews } = useTimelineLoader(
    `${relay}-reviews`,
    readRelays,
    filter
      ? {
          ...filter,
          kinds: [1985],
          "#r": [relay],
          "#l": [RELAY_REVIEW_LABEL],
        }
      : undefined,
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <Flex direction="column" gap="2">
      <IntersectionObserverProvider callback={callback}>
        {reviews?.map((event) => <RelayReviewNote key={event.id} event={event} hideUrl />)}
      </IntersectionObserverProvider>
    </Flex>
  );
}
