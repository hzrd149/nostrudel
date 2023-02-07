import { Button, Flex, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import { Post } from "../../components/post";
import { ThreadItem as ThreadItemData } from "../../helpers/thread";

export type ThreadItemProps = {
  post: ThreadItemData;
  initShowReplies?: boolean;
};

export const ThreadPost = ({ post, initShowReplies }: ThreadItemProps) => {
  const [showReplies, setShowReplies] = useState(!!initShowReplies);
  const toggle = () => setShowReplies((v) => !v);

  return (
    <Flex direction="column" gap="2">
      <Post event={post.event} />
      {post.children.length > 0 && (
        <>
          <Button variant="link" size="sm" alignSelf="flex-start" onClick={toggle}>
            {post.children.length} {post.children.length > 1 ? "Replies" : "Reply"}
          </Button>
          {showReplies && (
            <Flex direction="column" gap="2" pl="4" borderLeftColor="gray.500" borderLeftWidth="1px">
              {post.children.map((child) => (
                <ThreadPost key={post.event.id} post={child} />
              ))}
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
};
