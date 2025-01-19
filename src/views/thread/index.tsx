import { ReactNode } from "react";
import { Card, Heading, Link, Spinner } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Thread, ThreadQuery } from "applesauce-core/queries";
import { useStoreQuery } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";

import ThreadPost from "./components/thread-post";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useReadRelays } from "../../hooks/use-client-relays";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useThreadTimelineLoader from "../../hooks/use-thread-timeline-loader";
import useSingleEvent from "../../hooks/use-single-event";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import LoadingNostrLink from "../../components/loading-nostr-link";
import UserName from "../../components/user/user-name";
import UserAvatarLink from "../../components/user/user-avatar-link";
import { ReplyIcon } from "../../components/icons";
import TimelineNote from "../../components/note/timeline-note";
import { getSharableEventAddress } from "../../services/relay-hints";

function CollapsedReplies({
  pointer,
  thread,
  root,
}: {
  pointer: nip19.EventPointer;
  thread: Thread;
  root: nip19.EventPointer;
}) {
  const post = thread.all.get(pointer.id);
  if (!post) return <LoadingNostrLink link={{ type: "nevent", data: pointer }} />;

  let reply: ReactNode = null;
  if (post.refs.reply?.e && post.refs.reply.e.id !== root.id) {
    reply = <CollapsedReplies pointer={post.refs.reply.e} thread={thread} root={root} />;
  }

  return (
    <>
      {reply}
      <Card gap="2" overflow="hidden" px="2" display="flex" flexDirection="row" p="2" flexShrink={0}>
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
  thread: Thread;
  rootPointer: nip19.EventPointer;
  focusId: string;
}) {
  const isRoot = rootPointer.id === focusId;

  const focusedPost = thread.all.get(focusId);
  if (isRoot && thread.root) {
    return <ThreadPost post={thread.root} initShowReplies focusId={focusId} />;
  }

  if (!focusedPost) return null;

  const parentPosts = [];
  if (focusedPost.parent) {
    let p = focusedPost;
    while (p.parent) {
      parentPosts.unshift(p.parent);
      p = p.parent;
    }
  }

  const grandparentPointer = focusedPost.parent?.refs.reply?.e;

  return (
    <>
      {rootPointer && focusedPost.refs.reply?.e?.id !== rootPointer.id && (
        <CollapsedReplies pointer={rootPointer} thread={thread} root={rootPointer} />
      )}
      {grandparentPointer && grandparentPointer.id !== rootPointer.id && (
        <CollapsedReplies pointer={grandparentPointer} thread={thread} root={rootPointer} />
      )}
      {focusedPost.parent ? (
        <TimelineNote event={focusedPost.parent.event} hideDrawerButton showReplyLine={false} />
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
  const { rootPointer, timeline } = useThreadTimelineLoader(focusedEvent, readRelays);
  const thread = useStoreQuery(ThreadQuery, rootPointer && [rootPointer]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout maxW="6xl" mx="auto" w="full">
      {!focusedEvent && (
        <>
          <Heading my="4">
            <Spinner /> Loading note
          </Heading>
          <LoadingNostrLink link={{ type: "nevent", data: pointer }} />
        </>
      )}
      <IntersectionObserverProvider callback={callback}>
        {thread && focusedEvent && rootPointer && (
          <ThreadPage thread={thread} rootPointer={rootPointer} focusId={focusedEvent.id} />
        )}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
