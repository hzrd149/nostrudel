import { memo } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { COMMENT_KIND, getEventUID } from "applesauce-core/helpers";
import { useStoreQuery } from "applesauce-react/hooks";
import { CommentsQuery, RepliesQuery } from "applesauce-core/queries";

import Timestamp from "../timestamp";
import DebugEventButton from "../debug-modal/debug-event-button";
import UserLink from "../user/user-link";
import TextNoteContents from "../note/timeline-note/text-note-contents";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import UserAvatarLink from "../user/user-avatar-link";
import UserDnsIdentity from "../user/user-dns-identity";
import NoteReactions from "../note/timeline-note/components/note-reactions";
import { ChevronDownIcon, ChevronUpIcon, ReplyIcon } from "../icons";
import EventZapButton from "../zap/event-zap-button";
import GenericCommentForm from "./generic-comment-form";

const Comment = memo(({ comment, level = 0 }: { comment: NostrEvent; level?: number }) => {
  const reply = useDisclosure();
  const replies = useStoreQuery(RepliesQuery, [comment]);
  const expand = useDisclosure({ defaultIsOpen: true });
  const all = useDisclosure();

  return (
    <>
      <Card>
        <CardHeader px="4" py="2" display="flex" gap="2" alignItems="center">
          <UserAvatarLink pubkey={comment.pubkey} size="sm" />
          <Box>
            <UserLink pubkey={comment.pubkey} fontWeight="bold" me="2" />
            <Timestamp timestamp={comment.created_at} />
            <br />
            <UserDnsIdentity pubkey={comment.pubkey} />
          </Box>

          <ButtonGroup ms="auto" variant="ghost" size="sm" alignItems="center">
            <EventZapButton event={comment} aria-label="Zap comment" />
            <DebugEventButton event={comment} />
          </ButtonGroup>
        </CardHeader>
        <CardBody px="4" py="0">
          <TextNoteContents event={comment} />
        </CardBody>
        <CardFooter p="2" gap="2" display="flex">
          {!reply.isOpen && (
            <Button leftIcon={<ReplyIcon />} variant="ghost" size="sm" onClick={reply.onOpen}>
              reply
            </Button>
          )}
          <NoteReactions event={comment} size="sm" variant="ghost" />
          {replies && replies.length > 0 && (
            <IconButton
              ms="auto"
              icon={expand.isOpen ? <ChevronUpIcon boxSize={5} /> : <ChevronDownIcon boxSize={5} />}
              aria-label="Expand"
              size="sm"
              variant="ghost"
              onClick={expand.onToggle}
            />
          )}
        </CardFooter>
      </Card>
      {reply.isOpen && <GenericCommentForm event={comment} onCancel={reply.onClose} onSubmitted={reply.onClose} />}
      {replies && replies.length > 2 && expand.isOpen && !all.isOpen && (
        <Button w="full" variant="link" p="2" onClick={all.onOpen}>
          Show more replies ({replies.length - 2})
        </Button>
      )}
      {replies && replies.length > 0 && expand.isOpen && (
        <Flex pl="4" direction="column" gap="2" borderLeftWidth={1} position="relative">
          {(replies.length > 2 && !all.isOpen ? replies.slice(0, 2) : replies).map((reply) => (
            <Comment key={comment.id} comment={reply} level={level + 1} />
          ))}
        </Flex>
      )}
    </>
  );
});

export function GenericComments({ event }: { event: NostrEvent }) {
  const readRelays = useReadRelays();
  const { loader } = useTimelineLoader(
    `${getEventUID(event)}-comments`,
    readRelays,
    kinds.isParameterizedReplaceableKind(event.kind)
      ? {
          kinds: [COMMENT_KIND],
          "#A": [getEventUID(event)],
        }
      : {
          kinds: [COMMENT_KIND],
          "#E": [event.id],
        },
  );

  const comments = useStoreQuery(CommentsQuery, [event]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      {comments?.map((comment) => <Comment key={comment.id} comment={comment} />)}
    </IntersectionObserverProvider>
  );
}
