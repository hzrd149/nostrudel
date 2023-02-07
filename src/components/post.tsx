import React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import moment from "moment";
import { PostModal } from "./post-modal";
import { NostrEvent } from "../types/nostr-event";
import { useUserMetadata } from "../hooks/use-user-metadata";
import useSubject from "../hooks/use-subject";
import settings from "../services/settings";

export type PostProps = {
  event: NostrEvent;
};
export const Post = React.memo(({ event }: PostProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const userMetadata = useUserMetadata(event.pubkey);

  const isLong = event.content.length > 800;

  return (
    <Card>
      <CardHeader>
        <HStack spacing="4">
          <Flex flex="1" gap="4" alignItems="center" flexWrap="wrap">
            <Avatar src={userMetadata?.picture} />

            <Box>
              <Heading size="sm">
                <Link to={`/user/${event.pubkey}`}>
                  {userMetadata?.name ?? event.pubkey}
                </Link>
              </Heading>
              <Text>{moment(event.created_at * 1000).fromNow()}</Text>
            </Box>
          </Flex>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack alignItems="flex-start" justifyContent="stretch">
          <Box maxHeight="20rem" overflow="hidden" width="100%">
            <ReactMarkdown>
              {event.content.replace(/(?<! )\n/g, "  \n")}
            </ReactMarkdown>
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
