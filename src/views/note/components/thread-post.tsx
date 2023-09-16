import { useState } from "react";
import { Alert, AlertIcon, Button, ButtonGroup, Flex, useDisclosure } from "@chakra-ui/react";

import { ArrowDownSIcon, ArrowUpSIcon, ReplyIcon } from "../../../components/icons";
import { Note } from "../../../components/note";
import { countReplies, ThreadItem } from "../../../helpers/thread";
import { TrustProvider } from "../../../providers/trust";
import ReplyForm from "./reply-form";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";

export type ThreadItemProps = {
  post: ThreadItem;
  initShowReplies?: boolean;
  focusId?: string;
};

export const ThreadPost = ({ post, initShowReplies, focusId }: ThreadItemProps) => {
  const [showReplies, setShowReplies] = useState(initShowReplies ?? post.replies.length === 1);
  const toggle = () => setShowReplies((v) => !v);
  const showReplyForm = useDisclosure();

  const muteFilter = useClientSideMuteFilter();
  const [alwaysShow, setAlwaysShow] = useState(false);

  const numberOfReplies = countReplies(post);
  const isMuted = muteFilter(post.event);

  if (isMuted && numberOfReplies === 0) return null;

  return (
    <Flex direction="column" gap="2">
      {isMuted && !alwaysShow ? (
        <Alert status="warning">
          <AlertIcon />
          Muted user or note
          <Button size="xs" ml="auto" onClick={() => setAlwaysShow(true)}>
            Show anyway
          </Button>
        </Alert>
      ) : (
        <TrustProvider trust={focusId === post.event.id ? true : undefined}>
          <Note event={post.event} borderColor={focusId === post.event.id ? "blue.500" : undefined} hideDrawerButton />
        </TrustProvider>
      )}
      {showReplyForm.isOpen && (
        <ReplyForm item={post} onCancel={showReplyForm.onClose} onSubmitted={showReplyForm.onClose} />
      )}
      <ButtonGroup variant="link" size="sm" alignSelf="flex-start">
        {!showReplyForm.isOpen && (
          <Button onClick={showReplyForm.onOpen} leftIcon={<ReplyIcon />}>
            Write reply
          </Button>
        )}

        {post.replies.length > 0 && (
          <Button onClick={toggle}>
            {numberOfReplies} {numberOfReplies > 1 ? "Replies" : "Reply"}
            {showReplies ? <ArrowDownSIcon /> : <ArrowUpSIcon />}
          </Button>
        )}
      </ButtonGroup>
      {post.replies.length > 0 && showReplies && (
        <Flex direction="column" gap="2" pl={[2, 2, 4]} borderLeftColor="gray.500" borderLeftWidth="1px">
          {post.replies.map((child) => (
            <ThreadPost key={child.event.id} post={child} focusId={focusId} />
          ))}
        </Flex>
      )}
    </Flex>
  );
};
