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
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import moment from "moment";
import { PostModal } from "./post-modal";
import { EventSeenOn } from "./event-seen-on";

export const Post = ({ event }) => {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const isLong = event.content.length > 800;

  return (
    <Card>
      <CardHeader>
        <Flex spacing="4">
          <Flex flex="1" gap="4" alignItems="center" flexWrap="wrap">
            <Avatar name="Segun Adebayo" src="https://bit.ly/sage-adebayo" />

            <Box>
              <Heading size="sm">
                <Link to={`/user/${event.pubkey}`}>{event.pubkey}</Link>
              </Heading>
              <Text>{moment(event.created_at * 1000).fromNow()}</Text>
            </Box>
          </Flex>
        </Flex>
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
};
