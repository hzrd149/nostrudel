import { Button, Flex } from "@chakra-ui/react";
import { memo, useCallback, useRef } from "react";
import { kinds } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import useSubject from "../../hooks/use-subject";
import EmbeddedDM from "../../components/embed-event/event-types/embedded-dm";
import { NostrEvent } from "../../types/nostr-event";
import { ChevronLeftIcon } from "../../components/icons";
import { useNavigate } from "react-router-dom";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";

const DirectMessage = memo(({ dm }: { dm: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, dm.id);

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
  const timeline = useTimelineLoader(
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

  const dms = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <PeopleListSelection />
      </Flex>
      <IntersectionObserverProvider callback={callback}>
        {dms.map((dm) => (
          <DirectMessage key={dm.id} dm={dm} />
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
