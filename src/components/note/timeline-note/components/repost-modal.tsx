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
} from "@chakra-ui/react";
import { EventTemplate, NostrEvent, kinds } from "nostr-tools";
import dayjs from "dayjs";
import type { AddressPointer } from "nostr-tools/nip19";

import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from "../../../icons";
import { getAddressPointerRelayHints, getEventRelayHint } from "../../../../services/relay-hints";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import useCurrentAccount from "../../../../hooks/use-current-account";
import useUserCommunitiesList from "../../../../hooks/use-user-communities-list";
import { createCoordinate } from "../../../../classes/batch-kind-pubkey-loader";
import { EmbedEvent } from "../../../embed-event";

function buildRepost(event: NostrEvent): EventTemplate {
  const hint = getEventRelayHint(event);
  const tags: NostrEvent["tags"] = [];
  tags.push(["e", event.id, hint ?? ""]);
  tags.push(["k", String(event.kind)]);

  return {
    kind: event.kind === kinds.ShortTextNote ? kinds.Repost : kinds.GenericRepost,
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
  const publish = usePublishEvent();
  const showCommunities = useDisclosure();
  const { pointers } = useUserCommunitiesList(account?.pubkey);

  const [loading, setLoading] = useState(false);
  const repost = async (communityPointer?: AddressPointer) => {
    setLoading(true);
    const draft = buildRepost(event);
    if (communityPointer) {
      draft.tags.push([
        "a",
        createCoordinate(communityPointer.kind, communityPointer.pubkey, communityPointer.identifier),
        getAddressPointerRelayHints(communityPointer)[0],
      ]);
    }
    await publish("Repost", draft);
    onClose();
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
