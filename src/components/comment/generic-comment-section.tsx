import { Button, Flex, Heading, useDisclosure } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import GenericCommentForm from "./generic-comment-form";
import { GenericComments } from "./generic-comments";

export default function GenericCommentSection({ event }: { event: NostrEvent }) {
  const comment = useDisclosure();

  return (
    <>
      <Flex gap="2" alignItems="center" mt="4">
        <Heading size="lg">Comments</Heading>

        {!comment.isOpen && (
          <Button onClick={comment.onOpen} ms="auto">
            Add Comment
          </Button>
        )}
      </Flex>
      {comment.isOpen && (
        <GenericCommentForm
          event={event}
          onCancel={comment.onClose}
          onSubmitted={comment.onClose}
          aria-label="Add comment form"
        />
      )}

      <GenericComments event={event} />
    </>
  );
}
