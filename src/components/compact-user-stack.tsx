import {
  Flex,
  FlexProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  TagProps,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import UserAvatar from "./user/user-avatar";
import { getUserDisplayName } from "../helpers/nostr/user-metadata";
import useUserMetadata from "../hooks/use-user-metadata";

function UserTag({ pubkey, ...props }: { pubkey: string } & Omit<TagProps, "children">) {
  const metadata = useUserMetadata(pubkey);
  const npub = nip19.npubEncode(pubkey);

  const displayName = getUserDisplayName(metadata, pubkey);

  return (
    <Tag as={RouterLink} to={`/u/${npub}`} {...props}>
      <UserAvatar pubkey={pubkey} size="xs" mr="2" title={displayName} />
      {displayName}
    </Tag>
  );
}

export function UserAvatarStack({
  pubkeys,
  maxUsers,
  label = "Users",
  ...props
}: { pubkeys: string[]; maxUsers?: number; label?: string } & FlexProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const clamped = maxUsers ? pubkeys.slice(0, maxUsers) : pubkeys;

  return (
    <>
      {label && <span>{label}</span>}
      <Flex alignItems="center" gap="-4" overflow="hidden" cursor="pointer" onClick={onOpen} {...props}>
        {clamped.map((pubkey) => (
          <UserAvatar key={pubkey} pubkey={pubkey} size="2xs" />
        ))}
        {clamped.length !== pubkeys.length && (
          <Text mx="1" fontSize="sm" lineHeight={0}>
            +{pubkeys.length - clamped.length}
          </Text>
        )}
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader px="4" pt="4" pb="2">
            {label}:
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px="4" pb="4" pt="0">
            <Flex gap="2" wrap="wrap">
              {pubkeys.map((pubkey) => (
                <UserTag key={pubkey} pubkey={pubkey} p="2" fontWeight="bold" fontSize="md" />
              ))}
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
