import { Flex } from "@chakra-ui/react";

import { RELAY_REVIEW_LABEL } from "../../../helpers/nostr/reviews";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import useSubject from "../../../hooks/use-subject";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import RelayReviewNote from "../components/relay-review-note";
import { useAppTitle } from "../../../hooks/use-app-title";

export default function RelayReviews({ relay }: { relay: string }) {
  useAppTitle(`${relay} - Reviews`);
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${relay}-reviews`, readRelays, {
    kinds: [1985],
    "#r": [relay],
    "#l": [RELAY_REVIEW_LABEL],
  });

  const events = useSubject(timeline.timeline);

  return (
    <Flex direction="column" gap="2">
      {events.map((event) => (
        <RelayReviewNote key={event.id} event={event} hideUrl />
      ))}
    </Flex>
  );
}
