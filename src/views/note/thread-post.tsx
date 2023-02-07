import { Button, Flex, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import { Note } from "../../components/note";
import { countReplies, ThreadItem as ThreadItemData } from "../../helpers/thread";

export type ThreadItemProps = {
  post: ThreadItemData;
  initShowReplies?: boolean;
};

export const ThreadPost = ({ post, initShowReplies }: ThreadItemProps) => {
  const [showReplies, setShowReplies] = useState(!!initShowReplies);
  const toggle = () => setShowReplies((v) => !v);

  const numberOfReplies = countReplies(post);

  return (
    <Flex direction="column" gap="2">
      <Note event={post.event} />
      {post.replies.length > 0 && (
        <>
          <Button variant="link" size="sm" alignSelf="flex-start" onClick={toggle}>
            {numberOfReplies} {numberOfReplies > 1 ? "Replies" : "Reply"}
          </Button>
          {showReplies && (
            <Flex direction="column" gap="2" pl="4" borderLeftColor="gray.500" borderLeftWidth="1px">
              {post.replies.map((child) => (
                <ThreadPost key={child.event.id} post={child} />
              ))}
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
};
