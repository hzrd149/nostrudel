import { AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Flex, Text } from "@chakra-ui/react";
import { ProfilePointer } from "nostr-tools/nip19";

import UserAvatarLink from "../../../../components/user/user-avatar-link";

interface OrphanedUsersRowProps {
  users: ProfilePointer[];
}

export default function OrphanedUsersRow({ users }: OrphanedUsersRowProps) {
  if (users.length === 0) return null;

  return (
    <AccordionItem>
      <AccordionButton>
        <Box as="span" flex="1" textAlign="left">
          <Flex align="center" justify="space-between" w="full">
            <Text fontWeight="medium" color="red.500">
              Orphaned Users ({users.length})
            </Text>
          </Flex>
          <Text fontSize="sm" color="GrayText">
            Users who lost all relays after selection process
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
