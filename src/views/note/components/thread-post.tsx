import { useState } from "react";
import { Alert, AlertIcon, Button, ButtonGroup, Flex, useDisclosure } from "@chakra-ui/react";

import { ChevronDownIcon, ChevronUpIcon, ReplyIcon } from "../../../components/icons";
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

  const replies = post.replies.filter((r) => !muteFilter(r.event));
  const numberOfReplies = countReplies(replies);
  const isMuted = muteFilter(post.event);

  const [alwaysShow, setAlwaysShow] = useState(false);
  const muteAlert = (
    <Alert status="warning">
      <AlertIcon />
      Muted user or note
      <Button size="xs" ml="auto" onClick={() => setAlwaysShow(true)}>
        Show anyway
      </Button>
    </Alert>
  );

  if (isMuted && replies.length === 0) return null;

  return (
    <Flex direction="column" gap="2">
      {isMuted && !alwaysShow ? (
        muteAlert
      ) : (
        <TrustProvider trust={focusId === post.event.id ? true : undefined}>
          <Note
            event={post.event}
            borderColor={focusId === post.event.id ? "blue.500" : undefined}
            hideDrawerButton
            hideThreadLink
          />
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

        {replies.length > 0 && (
          <Button onClick={toggle}>
            {numberOfReplies} {numberOfReplies > 1 ? "Replies" : "Reply"}
            {showReplies ? <ChevronDownIcon /> : <ChevronUpIcon />}
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
