import { Badge, Box, Card, CardBody, Flex, Heading, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

import NappletIconImage from "../../../components/napplets/napplet-icon";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import {
  getNappletArchetypes,
  getNappletDescription,
  getNappletNaddr,
  getNappletTitle,
} from "../../../helpers/nostr/napplets";

const NappletStoreCard = memo(function NappletStoreCard({
  event,
  installed,
}: {
  event: NostrEvent;
  installed: boolean;
}) {
  const address = getNappletNaddr(event);
  const title = getNappletTitle(event);
  const description = getNappletDescription(event);
  const archetypes = getNappletArchetypes(event);

  return (
    <Card
      as={LinkBox}
      variant="outline"
      h="full"
      overflow="hidden"
      opacity={address ? 1 : 0.6}
      pointerEvents={address ? undefined : "none"}
    >
      <CardBody display="flex" flexDirection="column" gap="4">
        <Flex alignItems="flex-start" gap="3">
          <NappletIconImage event={event} boxSize="12" />
          <Box minW="0" flex="1">
            <Heading size="md" noOfLines={1} mb="1">
              {address ? (
                <LinkOverlay as={RouterLink} to={`/app/store/${address}`}>
                  {title}
                </LinkOverlay>
              ) : (
                title
              )}
            </Heading>
            <Flex gap="2" color="GrayText" fontSize="sm" alignItems="center" minW="0">
              <Text>by</Text>
              <UserAvatar pubkey={event.pubkey} size="xs" />
              <UserName pubkey={event.pubkey} fontSize="sm" isTruncated />
            </Flex>
          </Box>
          {installed && <Badge colorScheme="primary">Installed</Badge>}
        </Flex>

        <Text color="GrayText" fontSize="sm" noOfLines={3} minH="4.5em">
          {description || "No description provided."}
        </Text>

        <Flex mt="auto" gap="1" wrap="wrap" minW="0">
          {archetypes.length === 0 ? (
            <Badge>app</Badge>
          ) : (
            archetypes.slice(0, 4).map((archetype) => <Badge key={archetype.name}>{archetype.name}</Badge>)
          )}
          {archetypes.length > 4 && <Badge>+{archetypes.length - 4}</Badge>}
        </Flex>
      </CardBody>
    </Card>
  );
});

export default NappletStoreCard;
