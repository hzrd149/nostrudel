import { MouseEventHandler, useCallback, useMemo } from "react";
import { AvatarGroup, Box, Button, ButtonGroup, Flex, LinkBox, Text, useDisclosure } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { useObservable } from "applesauce-react/hooks";
import { Link as RouterLink, useNavigate } from "react-router";

import useCurrentAccount from "../../hooks/use-current-account";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import RequireCurrentAccount from "../../components/router/require-current-account";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useNotifications } from "../../providers/global/notifications-provider";
import { TORRENT_COMMENT_KIND } from "../../helpers/nostr/torrents";
import { groupByRoot } from "../../helpers/notification";
import { ChevronLeftIcon } from "../../components/icons";
import UserAvatarLink from "../../components/user/user-avatar-link";
import useSingleEvent from "../../hooks/use-single-event";
import UserLink from "../../components/user/user-link";
import { CompactNoteContent } from "../../components/compact-note-content";
import Timestamp from "../../components/timestamp";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";
import localSettings from "../../services/local-settings";
import GitBranch01 from "../../components/icons/git-branch-01";

const THREAD_KINDS = [kinds.ShortTextNote, TORRENT_COMMENT_KIND];

function ReplyEntry({ event }: { event: NostrEvent }) {
  const navigate = useNavigate();
  const address = useShareableEventAddress(event);
  const onClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/n/${address}`);
    },
    [navigate, address],
  );

  return (
    <LinkBox>
      <Flex gap="2">
        <UserLink pubkey={event.pubkey} fontWeight="bold" />
        <Timestamp timestamp={event.created_at} />
      </Flex>
      <CompactNoteContent event={event} maxLength={100} />
      <HoverLinkOverlay as={RouterLink} to={`/n/${address}`} onClick={onClick} />
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

  const ref = useEventIntersectionRef(events[events.length - 1]);

  return (
    <Flex ref={ref}>
      <GitBranch01 boxSize={8} color="green.500" mr="2" />
      <Flex direction="column" gap="2">
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
      </Flex>
    </Flex>
  );
}

function ThreadsNotificationsPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { people } = usePeopleListContext();
  const peoplePubkeys = useMemo(() => people?.map((p) => p.pubkey), [people]);

  const { timeline } = useNotifications();
  const callback = useTimelineCurserIntersectionCallback(timeline);
  const events = useObservable(timeline?.timeline) ?? [];

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
          <Button leftIcon={<ChevronLeftIcon boxSize={6} />} onClick={() => navigate(-1)}>
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
