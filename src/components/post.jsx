import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import moment from "moment";
import { PostModal } from "./post-modal";

export const Post = ({ event }) => {
  const { isOpen, onClose, onOpen } = useDisclosure();

  const isLong = event.content.length > 800;

  return (
    <Card>
      <CardBody>
        <VStack alignItems="flex-start" justifyContent="stretch">
          <Heading size="sm">
            <Link to={`/user/${event.pubkey}`}>{event.pubkey}</Link>{" "}
            <span>{moment(event.created_at * 1000).fromNow()}</span>
          </Heading>
          <Box maxHeight="10rem" overflow="hidden" width="100%">
            <ReactMarkdown>{event.content}</ReactMarkdown>
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
