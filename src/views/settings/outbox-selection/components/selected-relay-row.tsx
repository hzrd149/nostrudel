import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  HStack,
  Text,
} from "@chakra-ui/react";
import { ProfilePointer } from "nostr-tools/nip19";
import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import UserAvatarLink from "../../../../components/user/user-avatar-link";

export default function SelectRelayRow({
  relay,
  users,
  totalUsers,
}: {
  relay: string;
  users: ProfilePointer[];
  totalUsers: number;
}) {
  return (
    <AccordionItem>
      {({ isExpanded }) => (
        <>
          <AccordionButton>
            <Flex align="center" justify="space-between" w="full">
              <Flex align="center" gap={2}>
                <RelayFavicon relay={relay} size="sm" />
                <Box textAlign="left">
                  <RelayLink relay={relay} fontWeight="bold" isTruncated />
                  <Text fontSize="sm" color="GrayText">
                    {relay}
                  </Text>
                </Box>
              </Flex>
              <HStack gap={2}>
                <Text>
                  {users.length} ({totalUsers > 0 ? Math.round((users.length / totalUsers) * 100) : 0}%)
                </Text>
              </HStack>
            </Flex>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4} display="flex" flexWrap="wrap" gap={2}>
            {isExpanded && users.map((user) => <UserAvatarLink key={user.pubkey} user={user} showNip05={false} />)}
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  );
}
