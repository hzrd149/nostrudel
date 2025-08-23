import { Button, useDisclosure } from "@chakra-ui/react";

import ScrollLayout from "../../../../components/layout/presets/scroll-layout";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../../providers/local/intersection-observer";
import BlossomServerReviewForm from "../components/blossom-server-review-form";
import BlossomServerReview from "../components/blossom-server-review";
import useServerUrlParam from "../use-server-url-param";
import TimelineActionAndStatus from "../../../../components/timeline/timeline-action-and-status";

export const BLOSSOM_SERVER_REVIEW_KIND = 31963;

export default function BlossomReviewsView() {
  const showReviewForm = useDisclosure();
  const server = useServerUrlParam();
  const readRelays = useReadRelays();

  const { loader, timeline: reviews } = useTimelineLoader(`${server}-reviews`, readRelays, {
    kinds: [BLOSSOM_SERVER_REVIEW_KIND],
    "#d": [server],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout center maxW="6xl">
      {showReviewForm.isOpen ? (
        <BlossomServerReviewForm onClose={showReviewForm.onClose} server={server} my="4" />
      ) : (
        <Button colorScheme="primary" ml="auto" mb="2" onClick={showReviewForm.onOpen}>
          Write review
        </Button>
      )}

      <IntersectionObserverProvider callback={callback}>
        {reviews?.map((event) => (
          <BlossomServerReview key={event.id} event={event} />
        ))}
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
