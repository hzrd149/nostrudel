import { Button, Flex } from "@chakra-ui/react";
import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { kinds } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { NostrEvent } from "nostr-tools";
import { ChevronLeftIcon } from "../../components/icons";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { EmbedEventCard } from "../../components/embed-event/card";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import { ErrorBoundary } from "../../components/error-boundary";

const UnknownEvent = memo(({ event }: { event: NostrEvent }) => {
  const ref = useEventIntersectionRef(event);

  return (
    <div ref={ref}>
      <ErrorBoundary event={event}>
        <EmbedEventCard event={event} />
      </ErrorBoundary>
    </div>
  );
});

const commonTimelineKinds = [
  kinds.ShortTextNote,
  kinds.LongFormArticle,
  kinds.Repost,
  kinds.GenericRepost,
  kinds.Reaction,
  kinds.BadgeAward,
  kinds.BadgeDefinition,
  kinds.LiveEvent,
  kinds.Contacts,
  kinds.Metadata,
  kinds.EncryptedDirectMessage,
  kinds.Mutelist,
  kinds.LiveChatMessage,
  kinds.EventDeletion,
  kinds.CommunityPostApproval,
  kinds.BookmarkList,
  kinds.Bookmarksets,
  kinds.Followsets,
  kinds.Pinlist,
  kinds.CommunitiesList,
  kinds.ZapGoal,
];

export function UnknownTimelinePage() {
  const navigate = useNavigate();
  const { listId, filter } = usePeopleListContext();

  const clientMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (clientMuteFilter(e)) return false;
      if (commonTimelineKinds.includes(e.kind)) return false;
      return true;
    },
    [clientMuteFilter],
  );
  const readRelays = useReadRelays();
  const { loader, timeline } = useTimelineLoader(`${listId ?? "global"}-unknown-feed`, readRelays, filter, {
    eventFilter,
  });
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
        {timeline.map((event) => (
          <UnknownEvent key={event.id} event={event} />
        ))}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function UnknownTimelineView() {
  return (
    <PeopleListProvider>
      <UnknownTimelinePage />
    </PeopleListProvider>
  );
}
