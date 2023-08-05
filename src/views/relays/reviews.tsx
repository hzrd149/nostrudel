import { Button, Flex } from "@chakra-ui/react";

import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import RelayReviewNote from "./components/relay-review-note";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useNavigate } from "react-router-dom";

export default function RelayReviewsView() {
  const navigate = useNavigate();
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader("relay-reviews", readRelays, {
    kinds: [1985],
    "#l": ["review/relay"],
  });

  const reviews = useSubject(timeline.timeline);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider<string> callback={callback}>
      <Flex direction="column" gap="2" py="2">
        <Flex>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </Flex>
        {reviews.map((event) => (
          <RelayReviewNote key={event.id} event={event} />
        ))}
      </Flex>
    </IntersectionObserverProvider>
  );
}
