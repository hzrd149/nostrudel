import { AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Flex, Text } from "@chakra-ui/react";
import { ProfilePointer } from "nostr-tools/nip19";

import UserAvatar from "../../../../components/user/user-avatar";
import UserAvatarLink from "../../../../components/user/user-avatar-link";

interface RelayCountRowProps {
  relayCount: number;
  users: ProfilePointer[];
}

export default function RelayCountRow({ relayCount, users }: RelayCountRowProps) {
  const getDescription = (count: number): string => {
    if (count === 1) return "High risk - single point of failure";
    if (count <= 3) return "Limited redundancy - may have connectivity issues";
    if (count <= 5) return "Good coverage with reasonable redundancy";
    return "Excellent coverage with high redundancy";
  };

  return (
    <AccordionItem>
      <AccordionButton>
        <Box as="span" flex="1" textAlign="left">
          <Flex align="center" justify="space-between" w="full">
            <Box>
              <Text fontWeight="medium">
                {relayCount === 1 ? "1 Relay" : `${relayCount} Relays`} ({users.length})
              </Text>
              <Text fontSize="sm" color="GrayText">
                {getDescription(relayCount)}
              </Text>
            </Box>
          </Flex>
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
