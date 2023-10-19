import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardProps,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import {
  getCommunityDescription,
  getCommunityMods,
  getCommunityRelays,
  getCommunityRules,
} from "../../../helpers/nostr/communities";
import CommunityDescription from "../../communities/components/community-description";
import UserAvatarLink from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { RelayIconStack } from "../../../components/relay-icon-stack";
import { NostrEvent } from "../../../types/nostr-event";
import CommunityJoinButton from "../../communities/components/community-subscribe-button";
import CommunityMenu from "./community-menu";

export default function HorizontalCommunityDetails({
  community,
  ...props
}: Omit<CardProps, "children"> & { community: NostrEvent }) {
  const communityRelays = getCommunityRelays(community);
  const mods = getCommunityMods(community);
  const description = getCommunityDescription(community);
  const rules = getCommunityRules(community);

  const more = useDisclosure();

  return (
    <Card {...props}>
      <CardBody>
        <ButtonGroup float="right">
          <CommunityJoinButton community={community} />
          <CommunityMenu community={community} aria-label="More" />
        </ButtonGroup>
        {description && (
          <>
            <Heading size="sm" mb="2">
              Description
            </Heading>
            <CommunityDescription community={community} mb="2" />
          </>
        )}

        {more.isOpen ? (
          <SimpleGrid spacing="4" columns={2}>
            <Box>
              <Heading size="sm" mb="2">
                Mods
              </Heading>
              <Flex direction="column" gap="2">
                {mods.map((pubkey) => (
                  <Flex gap="2">
                    <UserAvatarLink pubkey={pubkey} size="xs" />
                    <UserLink pubkey={pubkey} />
                  </Flex>
                ))}
              </Flex>
            </Box>
            {rules && (
              <Box>
                <Heading size="sm" mb="2">
                  Rules
                </Heading>
                <Text whiteSpace="pre-wrap">{rules}</Text>
              </Box>
            )}
            {communityRelays.length > 0 && (
              <Box>
                <Heading size="sm" mt="4" mb="2">
                  Relays
                </Heading>
                <Flex direction="column" gap="2">
                  <RelayIconStack relays={communityRelays} />
                </Flex>
              </Box>
            )}
          </SimpleGrid>
        ) : (
          <Button variant="link" onClick={more.onOpen} w="full">
            Show more
          </Button>
        )}
      </CardBody>
    </Card>
  );
}
