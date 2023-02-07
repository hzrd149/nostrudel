import { Button, Flex, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import { ArrowDownSIcon, ArrowUpSIcon } from "../../components/icons";
import { Note } from "../../components/note";
import { countReplies, ThreadItem as ThreadItemData } from "../../helpers/thread";
import { useIsMobile } from "../../hooks/use-is-mobile";

export type ThreadItemProps = {
  post: ThreadItemData;
  initShowReplies?: boolean;
};

export const ThreadPost = ({ post, initShowReplies }: ThreadItemProps) => {
  const isMobile = useIsMobile();
  const [showReplies, setShowReplies] = useState(initShowReplies ?? post.replies.length === 1);
  const toggle = () => setShowReplies((v) => !v);

  const numberOfReplies = countReplies(post);

  return (
    <Flex direction="column" gap="2">
      <Note event={post.event} />
      {post.replies.length > 0 && (
        <>
          <Button variant="link" size="sm" alignSelf="flex-start" onClick={toggle}>
            {numberOfReplies} {numberOfReplies > 1 ? "Replies" : "Reply"}
            {showReplies ? <ArrowDownSIcon /> : <ArrowUpSIcon />}
          </Button>
          {showReplies && (
            <Flex direction="column" gap="2" pl={isMobile ? 2 : 4} borderLeftColor="gray.500" borderLeftWidth="1px">
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
