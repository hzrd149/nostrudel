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
import { kinds } from "nostr-tools";

import { NostrEvent } from "../../../types/nostr-event";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { getCommunityRelays } from "../../../helpers/nostr/communities";
import { getEventCoordinate } from "../../../helpers/nostr/event";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import UserLink from "../../../components/user/user-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserAvatarLink from "../../../components/user/user-avatar-link";

function UserCard({ pubkey }: { pubkey: string }) {
  return (
    <Flex overflow="hidden" gap="4" alignItems="center">
      <UserAvatarLink pubkey={pubkey} />
      <Flex direction="column" flex={1} overflow="hidden">
        <UserLink pubkey={pubkey} fontWeight="bold" />
        <UserDnsIdentity pubkey={pubkey} />
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
  const readRelays = useReadRelays(getCommunityRelays(community));
  const { loader, timeline: lists } = useTimelineLoader(`${communityCoordinate}-members`, readRelays, [
    { "#a": [communityCoordinate], kinds: [kinds.CommunitiesList] },
  ]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  const listsByPubkey: Record<string, NostrEvent> = {};
  if (lists) {
    for (const list of lists) {
      if (!listsByPubkey[list.pubkey] || listsByPubkey[list.pubkey].created_at < list.created_at) {
        listsByPubkey[list.pubkey] = list;
      }
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
              {lists?.map((list) => <UserCard key={list.id} pubkey={list.pubkey} />)}
            </SimpleGrid>
            <TimelineActionAndStatus timeline={loader} />
          </ModalBody>

          <ModalFooter px="4" pt="0" pb="4">
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </IntersectionObserverProvider>
  );
}
