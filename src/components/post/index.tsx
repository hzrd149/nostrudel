import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  HStack,
  IconButton,
  VStack,
  Link,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatarLink } from "../user-avatar-link";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";

import { PostContents } from "./post-contents";
import { PostMenu } from "./post-menu";
import { PostCC } from "./post-cc";
import { isReply } from "../../helpers/nostr-event";
import useSubject from "../../hooks/use-subject";
import identity from "../../services/identity";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { ArrowDownS } from "../icons";

export type PostProps = {
  event: NostrEvent;
};
export const Post = React.memo(({ event }: PostProps) => {
  const metadata = useUserMetadata(event.pubkey);

  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);
  const following = contacts?.contacts || [];

  return (
    <Card padding="2" variant="outline">
      <CardHeader padding="0" mb="2">
        <HStack spacing="4">
          <Flex flex="1" gap="2">
            <UserAvatarLink pubkey={event.pubkey} size="sm" />

            <Box>
              <Heading size="sm" display="inline">
                <Link as={RouterLink} to={`/u/${normalizeToBech32(event.pubkey, Bech32Prefix.Pubkey)}`}>
                  {getUserDisplayName(metadata, event.pubkey)}
                </Link>
              </Heading>
              <Link as={RouterLink} to={`/e/${normalizeToBech32(event.id, Bech32Prefix.Note)}`} ml="2">
                {moment(event.created_at * 1000).fromNow()}
              </Link>
              {isReply(event) && <PostCC event={event} />}
            </Box>
          </Flex>
          <PostMenu event={event} />
        </HStack>
      </CardHeader>
      <CardBody padding="0">
        <VStack alignItems="flex-start" justifyContent="stretch">
          <Box overflow="hidden" width="100%">
            <PostContents event={event} trusted={following.includes(event.pubkey)} />
          </Box>
        </VStack>
      </CardBody>
      {/* <CardFooter padding="0" gap="2"> */}
      {/* <Button
          size="sm"
          variant="link"
          onClick={() => navigate(`/e/${normalizeToBech32(event.id, Bech32Prefix.Note)}`)}
        >
          Replies
        </Button> */}
      {/* <ButtonGroup size="sm" isAttached variant="outline" ml="auto">
          <Button>Like</Button>
          <IconButton aria-label="Show Likes" icon={<ArrowDownS />} />
        </ButtonGroup> */}
      {/* </CardFooter> */}
    </Card>
  );
});
