import { Flex, Heading } from "@chakra-ui/react";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useSubject from "../../../hooks/use-subject";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import PeopleListProvider, { usePeopleListContext } from "../../../providers/local/people-list-provider";
import BackButton from "../../../components/router/back-button";
import PeopleListSelection from "../../../components/people-list-selection/people-list-selection";
import CorrectionCard from "./correction-card";

function CorrectionsPage() {
  const { listId, filter } = usePeopleListContext();
  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(
    `${listId}-corrections`,
    readRelays,
    filter ? [{ kinds: [1010], ...filter }] : undefined,
  );

  const corrections = useSubject(timeline.timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton size="sm" />
        <Heading size="md">Corrections</Heading>
        <PeopleListSelection />
      </Flex>

      {corrections.map((correction) => (
        <CorrectionCard correction={correction} key={correction.id} />
      ))}
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
