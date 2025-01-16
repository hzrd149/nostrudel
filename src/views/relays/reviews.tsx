import { Button, Flex, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router";

import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import RelayReviewNote from "./components/relay-review-note";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { ChevronLeftIcon } from "../../components/icons";

function RelayReviewsPage() {
  const navigate = useNavigate();
  const readRelays = useReadRelays();

  const { filter } = usePeopleListContext();
  const { loader, timeline: reviews } = useTimelineLoader(
    "relay-reviews",
    readRelays,
    filter
      ? {
          ...filter,
          kinds: [1985],
          "#l": ["review/relay"],
        }
      : undefined,
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2" alignItems="center">
          <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />}>
            Back
          </Button>
          <PeopleListSelection />
          <Heading size="md">Relay Reviews</Heading>
        </Flex>
        {reviews?.map((event) => <RelayReviewNote key={event.id} event={event} />)}
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function RelayReviewsView() {
  return (
    <PeopleListProvider initList="global">
      <RelayReviewsPage />
    </PeopleListProvider>
  );
}
