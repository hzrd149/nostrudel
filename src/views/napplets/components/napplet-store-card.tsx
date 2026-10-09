import { Badge, Box, Button, Card, CardBody, Flex, Heading, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { memo } from "react";
import { Link as RouterLink } from "react-router-dom";

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
  showOpenButton = false,
}: {
  event: NostrEvent;
  installed: boolean;
  showOpenButton?: boolean;
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
      _hover={{ borderColor: "primary.400", shadow: "md", transform: "translateY(-2px)" }}
      transition="all 0.15s ease"
    >
      <CardBody display="flex" flexDirection="column" gap="4">
        <Flex justifyContent="space-between" alignItems="flex-start" gap="3">
          <Box minW="0">
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

        <Flex mt="auto" alignItems="center" gap="2">
          <Flex gap="1" wrap="wrap" flex="1" minW="0">
            {archetypes.length === 0 ? (
              <Badge>app</Badge>
            ) : (
              archetypes.slice(0, 4).map((archetype) => <Badge key={archetype.name}>{archetype.name}</Badge>)
            )}
            {archetypes.length > 4 && <Badge>+{archetypes.length - 4}</Badge>}
          </Flex>
          {showOpenButton && address && (
            <Button
              as={RouterLink}
              to={`/app/${address}`}
              size="sm"
              colorScheme="primary"
              flexShrink={0}
              aria-label={`Open ${title}`}
            >
              Open
            </Button>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
});

export default NappletStoreCard;
