import { Button, useDisclosure } from "@chakra-ui/react";

import ScrollLayout from "../../../../components/layout/presets/scroll-layout";
import { RELAY_REVIEW_LABEL } from "../../../../helpers/nostr/reviews";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../../providers/local/intersection-observer";
import { usePeopleListContext } from "../../../../providers/local/people-list-provider";
import RelayReviewNote from "../../components/relay-review-note";
import RelayReviewForm from "../components/relay-review-form";
import useRelayUrlParam from "../use-relay-url-param";

export default function RelayReviewsView() {
  const showReviewForm = useDisclosure();
  const relay = useRelayUrlParam();
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
    <ScrollLayout center maxW="6xl">
      {showReviewForm.isOpen ? (
        <RelayReviewForm onClose={showReviewForm.onClose} relay={relay} my="4" />
      ) : (
        <Button colorScheme="primary" ml="auto" mb="2" onClick={showReviewForm.onOpen}>
          Write review
        </Button>
      )}

      <IntersectionObserverProvider callback={callback}>
        {reviews?.map((event) => (
          <RelayReviewNote key={event.id} event={event} hideUrl />
        ))}
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
