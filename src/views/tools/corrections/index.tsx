import { Flex, Heading } from "@chakra-ui/react";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../../providers/local/people-list-provider";
import BackButton from "../../../components/router/back-button";
import PeopleListSelection from "../../../components/people-list-selection/people-list-selection";
import CorrectionCard from "./correction-card";
import { CORRECTION_EVENT_KIND } from "../../../helpers/nostr/corrections";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

function CorrectionsPage() {
  const { listId, filter } = usePeopleListContext();
  const readRelays = useReadRelays();
  const { loader, timeline: corrections } = useTimelineLoader(
    `${listId}-corrections`,
    readRelays,
    filter ? [{ kinds: [CORRECTION_EVENT_KIND], ...filter }] : undefined,
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton size="sm" />
        <Heading size="md">Corrections</Heading>
        <PeopleListSelection />
      </Flex>

      <IntersectionObserverProvider callback={callback}>
        {corrections?.map((correction) => <CorrectionCard correction={correction} key={correction.id} />)}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function CorrectionsFeedView() {
  return (
    <PeopleListProvider>
      <CorrectionsPage />
    </PeopleListProvider>
  );
}
