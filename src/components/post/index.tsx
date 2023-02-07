import React from "react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatarLink } from "../user-avatar-link";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";

import { PostContents } from "./post-contents";
import { PostMenu } from "./post-menu";
import { PostCC } from "./post-cc";

export type PostProps = {
  event: NostrEvent;
};
export const Post = React.memo(({ event }: PostProps) => {
  const navigate = useNavigate();
  const metadata = useUserMetadata(event.pubkey);

  return (
    <Card padding="2" variant="outline">
      <CardHeader padding="0" mb="2">
        <HStack spacing="4">
          <Flex flex="1" gap="2">
            <UserAvatarLink pubkey={event.pubkey} size="sm" />

            <Box>
              <Heading size="sm" display="inline">
                <Link
                  to={`/u/${normalizeToBech32(
                    event.pubkey,
                    Bech32Prefix.Pubkey
                  )}`}
                >
                  {getUserDisplayName(metadata, event.pubkey)}
                </Link>
              </Heading>
              <Text display="inline" ml="2">
                {moment(event.created_at * 1000).fromNow()}
              </Text>
              <PostCC event={event} />
            </Box>
          </Flex>
          <PostMenu event={event} />
        </HStack>
      </CardHeader>
      <CardBody padding="0" mb="2">
        <VStack alignItems="flex-start" justifyContent="stretch">
          <Box overflow="hidden" width="100%">
            <PostContents content={event.content} />
          </Box>
        </VStack>
      </CardBody>
      <CardFooter padding="0">
        <Flex gap="2">
          <Button
            size="sm"
            variant="link"
            onClick={() =>
              navigate(`/e/${normalizeToBech32(event.id, Bech32Prefix.Note)}`)
            }
          >
            Replies
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
});
