import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  SimpleGrid,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { getCommunityRelays } from "../../../helpers/nostr/communities";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import { COMMUNITIES_LIST_KIND } from "../../../helpers/nostr/lists";
import IntersectionObserverProvider from "../../../providers/intersection-observer";
import useSubject from "../../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import UserLink from "../../../components/user-link";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import UserAvatarLink from "../../../components/user-avatar-link";

function UserCard({ pubkey }: { pubkey: string }) {
  return (
    <Flex overflow="hidden" gap="4" alignItems="center">
      <UserAvatarLink pubkey={pubkey} />
      <Flex direction="column" flex={1} overflow="hidden">
        <UserLink pubkey={pubkey} fontWeight="bold" />
        <UserDnsIdentityIcon pubkey={pubkey} />
      </Flex>
    </Flex>
  );
}

export default function CommunityMembersModal({
  community,
  onClose,
  ...props
}: Omit<ModalProps, "children"> & { community: NostrEvent }) {
  const communityCoordinate = getEventCoordinate(community);
  const readRelays = useReadRelayUrls(getCommunityRelays(community));
  const timeline = useTimelineLoader(`${communityCoordinate}-members`, readRelays, [
    { "#a": [communityCoordinate], kinds: [COMMUNITIES_LIST_KIND] },
  ]);

  const lists = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const listsByPubkey: Record<string, NostrEvent> = {};
  for (const list of lists) {
    if (!listsByPubkey[list.pubkey] || listsByPubkey[list.pubkey].created_at < list.created_at) {
      listsByPubkey[list.pubkey] = list;
    }
  }

  return (
    <IntersectionObserverProvider callback={callback}>
      <Modal onClose={onClose} size="4xl" {...props}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader px="4" pt="4" pb="0">
            Community Members
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p="4">
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="4">
              {lists.map((list) => (
                <UserCard key={list.id} pubkey={list.pubkey} />
              ))}
            </SimpleGrid>
            <TimelineActionAndStatus timeline={timeline} />
          </ModalBody>

          <ModalFooter px="4" pt="0" pb="4">
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </IntersectionObserverProvider>
  );
}
