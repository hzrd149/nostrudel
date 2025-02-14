import { Box, ButtonGroup } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { COMMENT_KIND } from "applesauce-core/helpers";
import { useStoreQuery } from "applesauce-react/hooks";
import { CommentsQuery } from "applesauce-core/queries";

import { useReadRelays } from "../../../hooks/use-client-relays";
import UserLink from "../../../components/user/user-link";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import TextNoteContents from "../../../components/note/timeline-note/text-note-contents";
import Timestamp from "../../../components/timestamp";

function Comment({ comment }: { comment: NostrEvent }) {
  return (
    <Box>
      <ButtonGroup float="right" variant="ghost" size="sm" alignItems="center">
        <Timestamp timestamp={comment.created_at} />
        <DebugEventButton event={comment} />
      </ButtonGroup>
      <Box float="left" mr="2">
        <UserLink pubkey={comment.pubkey} fontWeight="bold" />
      </Box>

      <TextNoteContents event={comment} />
    </Box>
  );
}

export function MediaPostComments({ post }: { post: NostrEvent }) {
  const readRelays = useReadRelays();
  const { loader } = useTimelineLoader(`${post.id}-comments`, readRelays, { kinds: [COMMENT_KIND], "#E": [post.id] });

  const comments = useStoreQuery(CommentsQuery, [post]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      {comments?.map((comment) => <Comment key={comment.id} comment={comment} />)}
    </IntersectionObserverProvider>
  );
}
