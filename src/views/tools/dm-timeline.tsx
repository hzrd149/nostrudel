import { Button, Flex } from "@chakra-ui/react";
import { memo, useCallback } from "react";
import { kinds } from "nostr-tools";
import { useNavigate } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import EmbeddedDM from "../../components/embed-event/card/embedded-dm";
import { NostrEvent } from "nostr-tools";
import { ChevronLeftIcon } from "../../components/icons";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { ErrorBoundary } from "../../components/error-boundary";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

const DirectMessage = memo(({ dm }: { dm: NostrEvent }) => {
  const ref = useEventIntersectionRef(dm);

  return (
    <div ref={ref}>
      <EmbeddedDM dm={dm} />
    </div>
  );
});

export function DMTimelinePage() {
  const navigate = useNavigate();
  const { listId, filter } = usePeopleListContext();

  const clientMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (clientMuteFilter(e)) return false;
      return true;
    },
    [clientMuteFilter],
  );
  const readRelays = useReadRelays();
  const { loader, timeline: dms } = useTimelineLoader(
    `${listId ?? "global"}-dm-feed`,
    readRelays,
    filter
      ? [
          {
            ...filter,
            kinds: [kinds.EncryptedDirectMessage],
          },
          { "#p": filter.authors, kinds: [kinds.EncryptedDirectMessage] },
        ]
      : { kinds: [kinds.EncryptedDirectMessage] },
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {dms?.map((dm) => (
          <ErrorBoundary key={dm.id} event={dm}>
            <DirectMessage dm={dm} />
          </ErrorBoundary>
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function DMTimelineView() {
  return (
    <PeopleListProvider>
      <DMTimelinePage />
    </PeopleListProvider>
  );
}
