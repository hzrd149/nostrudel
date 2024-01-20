// NOTE: this should be an option in the main feed
// Also this can be used as a way of discovering apps when NIP-89 is implemented
import { Button, Flex } from "@chakra-ui/react";
import { memo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { NostrEvent } from "../../types/nostr-event";
import { ChevronLeftIcon } from "../../components/icons";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import { getEventUID } from "../../helpers/nostr/events";
import { EmbedEvent } from "../../components/embed-event";
import { STREAM_CHAT_MESSAGE_KIND, STREAM_KIND } from "../../helpers/nostr/stream";
import {
  BOOKMARK_LIST_KIND,
  BOOKMARK_LIST_SET_KIND,
  COMMUNITIES_LIST_KIND,
  MUTE_LIST_KIND,
  PEOPLE_LIST_KIND,
  PIN_LIST_KIND,
} from "../../helpers/nostr/lists";

const UnknownEvent = memo(({ event }: { event: NostrEvent }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <div ref={ref}>
      <EmbedEvent event={event} />
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
  STREAM_KIND,
  kinds.Contacts,
  kinds.Metadata,
  kinds.EncryptedDirectMessage,
  MUTE_LIST_KIND,
  STREAM_CHAT_MESSAGE_KIND,
  kinds.EventDeletion,
  kinds.CommunityPostApproval,
  BOOKMARK_LIST_KIND,
  BOOKMARK_LIST_SET_KIND,
  PEOPLE_LIST_KIND,
  PIN_LIST_KIND,
  COMMUNITIES_LIST_KIND,
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
  const timeline = useTimelineLoader(`${listId ?? "global"}-unknown-feed`, readRelays, filter, { eventFilter });

  const events = useSubject(timeline.timeline);
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
        {events.map((dm) => (
          <UnknownEvent key={dm.id} event={dm} />
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
