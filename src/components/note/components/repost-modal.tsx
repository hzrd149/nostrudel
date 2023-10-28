import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  SimpleGrid,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { EmbedEvent } from "../../embed-event";
import { getEventRelays } from "../../../services/event-relays";
import relayScoreboardService from "../../../services/relay-scoreboard";
import { Kind } from "nostr-tools";
import dayjs from "dayjs";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";
import { useSigningContext } from "../../../providers/signing-provider";
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from "../../icons";
import useJoinedCommunitiesList from "../../../hooks/use-communities-joined-list";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import { createCoordinate } from "../../../services/replaceable-event-requester";

function buildRepost(event: NostrEvent): DraftNostrEvent {
  const relays = getEventRelays(event.id).value;
  const topRelay = relayScoreboardService.getRankedRelays(relays)[0] ?? "";

  const tags: NostrEvent["tags"] = [];
  tags.push(["e", event.id, topRelay]);

  return {
    kind: Kind.Repost,
    tags,
    content: JSON.stringify(event),
    created_at: dayjs().unix(),
  };
}

export default function RepostModal({
  event,
  isOpen,
  onClose,
  ...props
}: Omit<ModalProps, "children"> & { event: NostrEvent }) {
  const account = useCurrentAccount();
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const showCommunities = useDisclosure();
  const { pointers } = useJoinedCommunitiesList(account?.pubkey);

  const [loading, setLoading] = useState(false);
  const repost = async (communityPointer?: AddressPointer) => {
    try {
      setLoading(true);
      const draftRepost = buildRepost(event);
      if (communityPointer) {
        draftRepost.tags.push([
          "a",
          createCoordinate(communityPointer.kind, communityPointer.pubkey, communityPointer.identifier),
        ]);
      }
      const signed = await requestSignature(draftRepost);
      const pub = new NostrPublishAction("Repost", clientRelaysService.getWriteUrls(), signed);
      await pub.onComplete;
      onClose();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px="4" py="2">
          Repost Note
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0">
          <EmbedEvent event={event} />
          {showCommunities.isOpen && (
            <SimpleGrid spacing="2" columns={{ base: 1, sm: 2 }} mt="2">
              {pointers.map((pointer) => (
                <Button
                  key={pointer.identifier + pointer.pubkey}
                  size="md"
                  variant="outline"
                  rightIcon={<ExternalLinkIcon />}
                  isLoading={loading}
                  onClick={() => repost(pointer)}
                >
                  {pointer.identifier}
                </Button>
              ))}
            </SimpleGrid>
          )}
        </ModalBody>

        <ModalFooter px="4" py="4">
          <Button
            variant="link"
            flex={1}
            size="md"
            rightIcon={showCommunities.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            py="2"
            onClick={showCommunities.onToggle}
          >
            Repost to community
          </Button>
          <Button variant="ghost" size="md" mr={2} onClick={onClose} flexShrink={0}>
            Cancel
          </Button>
          {!showCommunities.isOpen && (
            <Button
              colorScheme="primary"
              variant="solid"
              onClick={() => repost()}
              size="md"
              isLoading={loading}
              flexShrink={0}
            >
              Repost
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
