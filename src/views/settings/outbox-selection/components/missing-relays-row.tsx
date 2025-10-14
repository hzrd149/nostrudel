import { AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Flex, Text } from "@chakra-ui/react";
import { ProfilePointer } from "nostr-tools/nip19";

import UserAvatarLink from "../../../../components/user/user-avatar-link";

interface MissingRelaysRowProps {
  users: ProfilePointer[];
}

export default function MissingRelaysRow({ users }: MissingRelaysRowProps) {
  if (users.length === 0) return null;

  return (
    <AccordionItem>
      <AccordionButton>
        <Box as="span" flex="1" textAlign="left">
          <Flex align="center" justify="space-between" w="full">
            <Text fontWeight="medium" color="orange.500">
              Missing Relays ({users.length})
            </Text>
          </Flex>
          <Text fontSize="sm" color="GrayText">
            Users without any relays (no NIP-65 relay list published)
          </Text>
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={4} display="flex" flexWrap="wrap" gap={2}>
        {users.map((user) => (
          <UserAvatarLink key={user.pubkey} user={user} showNip05={false} />
        ))}
      </AccordionPanel>
    </AccordionItem>
  );
}
