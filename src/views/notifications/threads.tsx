import { MouseEventHandler, useCallback, useMemo, useRef } from "react";
import { kinds } from "nostr-tools";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import useCurrentAccount from "../../hooks/use-current-account";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotificationTimeline } from "../../providers/global/notification-timeline";
import { TORRENT_COMMENT_KIND } from "../../helpers/nostr/torrents";
import { groupByRoot } from "../../helpers/notification";
import { NostrEvent } from "../../types/nostr-event";
import NotificationIconEntry from "./components/notification-icon-entry";
import { ChevronLeftIcon, ReplyIcon } from "../../components/icons";
import { AvatarGroup, Box, Button, ButtonGroup, Flex, LinkBox, Text, useDisclosure } from "@chakra-ui/react";
import UserAvatarLink from "../../components/user-avatar-link";
import useSingleEvent from "../../hooks/use-single-event";
import UserLink from "../../components/user-link";
import { CompactNoteContent } from "../../components/compact-note-content";
import Timestamp from "../../components/timestamp";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import { getSharableEventAddress } from "../../helpers/nip19";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import { getEventUID } from "../../helpers/nostr/events";
import { useNavigateInDrawer } from "../../providers/drawer-sub-view-provider";

const THREAD_KINDS = [kinds.ShortTextNote, TORRENT_COMMENT_KIND];

function ReplyEntry({ event }: { event: NostrEvent }) {
  const navigate = useNavigateInDrawer();
  const onClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/n/${getSharableEventAddress(event)}`);
    },
    [navigate],
  );

  return (
    <LinkBox>
      <Flex gap="2">
        <UserLink pubkey={event.pubkey} fontWeight="bold" />
        <Timestamp timestamp={event.created_at} />
      </Flex>
      <CompactNoteContent event={event} maxLength={100} />
      <HoverLinkOverlay as={RouterLink} to={`/n/${getSharableEventAddress(event)}`} onClick={onClick} />
    </LinkBox>
  );
}

function ThreadGroup({ rootId, events }: { rootId: string; events: NostrEvent[] }) {
  const pubkeys = events.reduce<string[]>((arr, e) => {
    if (!arr.includes(e.pubkey)) arr.push(e.pubkey);
    return arr;
  }, []);
  const showAll = useDisclosure();

  const rootEvent = useSingleEvent(rootId);

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(events[events.length - 1]));

  return (
    <NotificationIconEntry icon={<ReplyIcon boxSize={8} />}>
      <AvatarGroup size="sm">
        {pubkeys.map((pubkey) => (
          <UserAvatarLink key={pubkey} pubkey={pubkey} />
        ))}
      </AvatarGroup>
      <Box>
        <Text fontWeight="bold">
          {pubkeys.length > 1 ? pubkeys.length + " people" : pubkeys.length + " person"} replied in thread:
        </Text>
        {rootEvent && <CompactNoteContent event={rootEvent} maxLength={100} color="GrayText" />}
      </Box>
      {(events.length > 3 && !showAll.isOpen ? events.slice(0, 3) : events).map((event) => (
        <ReplyEntry key={event.id} event={event} />
      ))}
      {!showAll.isOpen && events.length > 3 && (
        <ButtonGroup>
          <Button variant="link" py="2" onClick={showAll.onOpen} colorScheme="primary" fontWeight="bold">
            +{events.length - 3} more
          </Button>
        </ButtonGroup>
      )}
    </NotificationIconEntry>
  );
}

function ThreadsNotificationsPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { people } = usePeopleListContext();
  const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

  const timeline = useNotificationTimeline();
  const callback = useTimelineCurserIntersectionCallback(timeline);
  const events = useSubject(timeline?.timeline);

  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        if (!THREAD_KINDS.includes(e.kind)) return false;
        if (peoplePubkeys && !peoplePubkeys.includes(e.pubkey)) return false;
        return true;
      }),
    [events],
  );
  const threads = useMemo(() => groupByRoot(filteredEvents), [filteredEvents]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        <Flex gap="2">
          <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <PeopleListSelection />
        </Flex>
        {threads.map((thread) => (
          <ThreadGroup key={thread[0]} rootId={thread[0]} events={thread[1]} />
        ))}
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}

export default function ThreadsNotificationsView() {
  return (
    <RequireCurrentAccount>
      <PeopleListProvider initList="global">
        <ThreadsNotificationsPage />
      </PeopleListProvider>
    </RequireCurrentAccount>
  );
}
