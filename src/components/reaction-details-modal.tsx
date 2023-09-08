import {
  AvatarGroup,
  Box,
  Divider,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  SimpleGrid,
} from "@chakra-ui/react";
import { useMemo } from "react";

import { NostrEvent } from "../types/nostr-event";
import { groupReactions } from "../helpers/nostr/reactions";
import { ReactionIcon } from "./event-reactions";
import { UserAvatarLink } from "./user-avatar-link";
import { UserLink } from "./user-link";

export type ReactionDetailsModalProps = Omit<ModalProps, "children"> & {
  reactions: NostrEvent[];
};

export default function ReactionDetailsModal({ reactions, onClose, ...props }: ReactionDetailsModalProps) {
  const groups = useMemo(() => groupReactions(reactions), [reactions]);

  return (
    <Modal onClose={onClose} size="2xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px="4" pb="0">
          Reactions
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" gap="2" px="4" pt="0" flexDirection="column">
          {groups.map((group) => (
            <Box key={group.emoji}>
              <Flex gap="2" py="2" alignItems="center">
                <Box fontSize="lg" borderWidth={1} w="8" h="8" borderRadius="md" p="1">
                  <ReactionIcon emoji={group.emoji} url={group.url} />
                </Box>
                <Divider />
              </Flex>
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing="1">
                {group.pubkeys.map((pubkey) => (
                  <Flex gap="2" key={pubkey} alignItems="center" overflow="hidden">
                    <UserAvatarLink pubkey={pubkey} size="xs" />
                    <UserLink pubkey={pubkey} isTruncated />
                  </Flex>
                ))}
              </SimpleGrid>
            </Box>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
