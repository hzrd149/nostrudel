import {
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { Navigate, useParams } from "react-router-dom";

import { includeMailboxes, withImmediateValueOrDefault } from "applesauce-core";
import { getSeenRelays, normalizeURL } from "applesauce-core/helpers";
import { useObservableEagerMemo } from "applesauce-react/hooks";
import { useCallback, useMemo } from "react";
import { map } from "rxjs";
import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayLink from "../../../components/relay/relay-link";
import GenericNoteTimeline, { GENERIC_TIMELINE_KINDS } from "../../../components/timeline-page/generic-note-timeline";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import { useAppTitle } from "../../../hooks/use-app-title";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { eventStore } from "../../../services/event-store";
import { RelayAuthAlert } from "../relays/relay-feed";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";

export function OutboxFeedPage({ relay }: { relay: string }) {
  relay = normalizeURL(relay);
  const account = useActiveAccount();
  const modal = useDisclosure();

  // Get all contacts to calculate total
  const allContacts = useObservableEagerMemo(
    () =>
      account &&
      eventStore
        .contacts({ pubkey: account.pubkey })
        .pipe(includeMailboxes(eventStore, "outbox"), withImmediateValueOrDefault(undefined)),
    [account?.pubkey],
  );

  // Get the contacts who publish to this relay
  const contacts = useObservableEagerMemo(
    () =>
      account &&
      eventStore.contacts({ pubkey: account.pubkey }).pipe(
        // Include the users outboxes
        includeMailboxes(eventStore, "outbox"),
        // Only get users who publish to this relay
        map((users) => users && users.filter((user) => user.relays?.includes(relay))),
        // Fix for React
        withImmediateValueOrDefault(undefined),
      ),
    [account?.pubkey],
  );

  const totalContacts = useMemo(() => allContacts?.length || 0, [allContacts]);
  const percentage = useMemo(
    () => (totalContacts > 0 && contacts ? Math.round((contacts.length / totalContacts) * 100) : 0),
    [contacts, totalContacts],
  );

  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!getSeenRelays(event)?.has(relay)) return false;
      if (muteFilter(event)) return false;
      return true;
    },
    [relay, muteFilter],
  );

  const { loader, timeline } = useTimelineLoader(
    `outbox-feed-${relay}`,
    [relay],
    contacts
      ? {
          kinds: GENERIC_TIMELINE_KINDS,
          authors: contacts.map((user) => user.pubkey),
        }
      : undefined,
    { eventFilter },
  );

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <>
      <SimpleView
        title={
          <Flex gap="2" alignItems="center">
            <RelayFavicon relay={relay} size="sm" />
            <RelayLink relay={relay} fontWeight="bold" isTruncated />
          </Flex>
        }
        actions={
          contacts &&
          contacts.length > 0 && (
            <Button variant="ghost" onClick={modal.onOpen}>
              {contacts.length} users ({percentage}%)
            </Button>
          )
        }
        center
        maxW="container.xl"
      >
        <RelayAuthAlert relay={relay} />

        <IntersectionObserverProvider callback={callback}>
          {timeline && <GenericNoteTimeline timeline={timeline} />}
          <LoadMoreButton loader={loader} />
        </IntersectionObserverProvider>
      </SimpleView>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Contacts who publish to this relay</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4} display="flex" flexDirection="column" gap={2}>
            {contacts?.map((user) => (
              <HStack key={user.pubkey} spacing={2} borderRadius="md">
                <UserAvatarLink pubkey={user.pubkey} size="sm" />
                <Flex direction="column">
                  <UserLink pubkey={user.pubkey} />
                  <UserDnsIdentity pubkey={user.pubkey} fontSize="xs" />
                </Flex>
              </HStack>
            ))}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function OutboxFeedView() {
  const { relay } = useParams();
  useAppTitle(`${relay} - Outbox Feed`);

  if (!relay) return <Navigate to="/feeds/outboxes" />;

  return <OutboxFeedPage relay={relay} />;
}
