import {
  AvatarGroup,
  Box,
  Divider,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import { useMemo } from "react";

import { NostrEvent } from "../types/nostr-event";
import { groupReactions } from "../helpers/nostr/reactions";
import { ReactionIcon } from "./event-reactions";
import { UserAvatarLink } from "./user-avatar-link";

export type ReactionDetailsModalProps = Omit<ModalProps, "children"> & {
  reactions: NostrEvent[];
};

export default function ReactionDetailsModal({ reactions, onClose, ...props }: ReactionDetailsModalProps) {
  const groups = useMemo(() => groupReactions(reactions), [reactions]);

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader px="4" pb="0">
          Reactions
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" gap="2" px="4" pt="0" flexWrap="wrap">
          {groups.map((group) => (
            <Box key={group.emoji}>
              <ReactionIcon emoji={group.emoji} count={group.count} url={group.url} />
              <AvatarGroup size="sm" flexWrap="wrap">
                {group.pubkeys.map((pubkey) => (
                  <UserAvatarLink key={pubkey} pubkey={pubkey} />
                ))}
              </AvatarGroup>
            </Box>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
