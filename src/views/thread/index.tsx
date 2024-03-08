import { ReactNode, useMemo } from "react";
import { Card, Heading, Link, Spinner } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { ThreadPost } from "./components/thread-post";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useReadRelays } from "../../hooks/use-client-relays";
import { ThreadItem, buildThread } from "../../helpers/thread";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useThreadTimelineLoader from "../../hooks/use-thread-timeline-loader";
import useSingleEvent from "../../hooks/use-single-event";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import LoadingNostrLink from "../../components/loading-nostr-link";
import UserName from "../../components/user/user-name";
import { getSharableEventAddress } from "../../helpers/nip19";
import UserAvatarLink from "../../components/user/user-avatar-link";
import { ReplyIcon } from "../../components/icons";
import TimelineNote from "../../components/note/timeline-note";

function CollapsedReplies({
  pointer,
  thread,
  root,
}: {
  pointer: nip19.EventPointer;
  thread: Map<string, ThreadItem>;
  root: nip19.EventPointer;
}) {
  const post = thread.get(pointer.id);
  if (!post) return <LoadingNostrLink link={{ type: "nevent", data: pointer }} />;

  let reply: ReactNode = null;
  if (post.refs.reply?.e && post.refs.reply.e.id !== root.id) {
    reply = <CollapsedReplies pointer={post.refs.reply.e} thread={thread} root={root} />;
  }

  return (
    <>
      {reply}
      <Card gap="2" overflow="hidden" px="2" display="flex" flexDirection="row" p="2">
        <UserAvatarLink pubkey={post.event.pubkey} size="xs" />
        <UserName pubkey={post.event.pubkey} fontWeight="bold" />
        {root.id !== pointer.id && <ReplyIcon />}
        <Link as={RouterLink} to={`/n/${getSharableEventAddress(post.event)}`} isTruncated>
          {post.event.content}
        </Link>
      </Card>
    </>
  );
}

function ThreadPage({
  thread,
  rootPointer,
  focusId,
}: {
  thread: Map<string, ThreadItem>;
  rootPointer: nip19.EventPointer;
  focusId: string;
}) {
  const isRoot = rootPointer.id === focusId;

  const focusedPost = thread.get(focusId);
  const rootPost = thread.get(rootPointer.id);
  if (isRoot && rootPost) {
    return <ThreadPost post={rootPost} initShowReplies focusId={focusId} />;
  }

  if (!focusedPost) return null;

  const parentPosts = [];
  if (focusedPost.replyingTo) {
    let p = focusedPost;
    while (p.replyingTo) {
      parentPosts.unshift(p.replyingTo);
      p = p.replyingTo;
    }
  }

  const grandparentPointer = focusedPost.replyingTo?.refs.reply?.e;

  return (
    <>
      {rootPointer && focusedPost.refs.reply?.e?.id !== rootPointer.id && (
        <CollapsedReplies pointer={rootPointer} thread={thread} root={rootPointer} />
      )}
      {grandparentPointer && grandparentPointer.id !== rootPointer.id && (
        <CollapsedReplies pointer={grandparentPointer} thread={thread} root={rootPointer} />
      )}
      {focusedPost.replyingTo ? (
        <TimelineNote event={focusedPost.replyingTo.event} hideDrawerButton showReplyLine={false} />
      ) : (
        focusedPost.refs.reply?.e && <LoadingNostrLink link={{ type: "nevent", data: focusedPost.refs.reply.e }} />
      )}
      <ThreadPost post={focusedPost} initShowReplies focusId={focusId} />
    </>
  );
}

export default function ThreadView() {
  const pointer = useParamsEventPointer("id");
  const readRelays = useReadRelays(pointer.relays);

  const focusedEvent = useSingleEvent(pointer.id, pointer.relays);
  const { rootPointer, events, timeline } = useThreadTimelineLoader(focusedEvent, readRelays);
  const thread = useMemo(() => buildThread(events), [events]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout px={{ base: 0, md: "2" }}>
      {!focusedEvent && (
        <>
          <Heading my="4">
            <Spinner /> Loading note
          </Heading>
          <LoadingNostrLink link={{ type: "nevent", data: pointer }} />
        </>
      )}
      <IntersectionObserverProvider callback={callback}>
        {focusedEvent && rootPointer && (
          <ThreadPage thread={thread} rootPointer={rootPointer} focusId={focusedEvent.id} />
        )}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
