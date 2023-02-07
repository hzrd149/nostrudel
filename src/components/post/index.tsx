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
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useCopyToClipboard } from "react-use";
import { PostModal } from "../post-modal";
import { NostrEvent } from "../../types/nostr-event";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatarLink } from "../user-avatar-link";
import { getUserFullName } from "../../helpers/user-metadata";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";

import { PostContents } from "../post-contents";
import { PostMenu } from "./post-menu";

export type PostProps = {
  event: NostrEvent;
};
export const Post = React.memo(({ event }: PostProps) => {
  const [_clipboardState, copyToClipboard] = useCopyToClipboard();
  const navigate = useNavigate();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { metadata } = useUserMetadata(event.pubkey);

  const username = metadata
    ? getUserFullName(metadata) || event.pubkey
    : event.pubkey;

  return (
    <Card padding="2" variant="outline">
      <CardHeader padding="0" mb="2">
        <HStack spacing="4">
          <Flex flex="1" gap="2" alignItems="center" flexWrap="wrap">
            <UserAvatarLink pubkey={event.pubkey} size="sm" />

            <Box>
              <Heading size="sm">
                <Link
                  to={`/user/${normalizeToBech32(
                    event.pubkey,
                    Bech32Prefix.Pubkey
                  )}`}
                >
                  {username}
                </Link>
              </Heading>
              <Text>{moment(event.created_at * 1000).fromNow()}</Text>
            </Box>
          </Flex>
          <PostMenu event={event} />
        </HStack>
      </CardHeader>
      <CardBody padding="0" mb="2">
        <VStack alignItems="flex-start" justifyContent="stretch">
          <Box overflow="hidden" width="100%">
            <PostContents content={event.content} maxChars={300} />
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
          <Button size="sm" variant="link" onClick={onOpen}>
            Expand
          </Button>
        </Flex>
        <PostModal event={event} isOpen={isOpen} onClose={onClose} />
      </CardFooter>
    </Card>
  );
});
