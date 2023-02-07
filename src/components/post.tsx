import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  IconButton,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import moment from "moment";
import { PostModal } from "./post-modal";
import { NostrEvent } from "../types/nostr-event";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { UserAvatarLink } from "./user-avatar-link";
import { getUserFullName } from "../helpers/user-metadata";

import codeIcon from "./icons/code-line.svg";
import styled from "@emotion/styled";
import { PostContents } from "./post-contents";

const SimpleIcon = styled.img`
  width: 1.2em;
`;

export type PostProps = {
  event: NostrEvent;
};
export const Post = React.memo(({ event }: PostProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { metadata } = useUserMetadata(event.pubkey);

  const isLong = event.content.length > 800;
  const username = metadata
    ? getUserFullName(metadata) || event.pubkey
    : event.pubkey;

  return (
    <Card padding="2" variant="outline">
      <CardHeader padding="0">
        <HStack spacing="4">
          <Flex flex="1" gap="2" alignItems="center" flexWrap="wrap">
            <UserAvatarLink pubkey={event.pubkey} size="sm" />

            <Box>
              <Heading size="sm">
                <Link to={`/user/${event.pubkey}`}>{username}</Link>
              </Heading>
              <Text>{moment(event.created_at * 1000).fromNow()}</Text>
            </Box>
          </Flex>
          <IconButton
            alignSelf="flex-start"
            icon={<SimpleIcon src={codeIcon} />}
            aria-label="view raw"
            title="view raw"
            size="xs"
            variant="link"
            onClick={() =>
              window.open(`https://www.nostr.guru/e/${event.id}`, "_blank")
            }
          />
        </HStack>
      </CardHeader>
      <CardBody pt="2" pb="0" pr="0" pl="0">
        <VStack alignItems="flex-start" justifyContent="stretch">
          <Box maxHeight="20rem" overflow="hidden" width="100%">
            <PostContents content={event.content}/>
          </Box>
          {isLong && (
            <>
              <Button size="sm" variant="link" onClick={onOpen}>
                Read More
              </Button>
              <PostModal event={event} isOpen={isOpen} onClose={onClose} />
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
});
