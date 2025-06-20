import { Box, Heading, Link, LinkBox, Spinner, useDisclosure } from "@chakra-ui/react";
import { getNip10References } from "applesauce-core/helpers";
import { Thread, ThreadModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { nip19, NostrEvent } from "nostr-tools";
import { EventPointer } from "nostr-tools/nip19";
import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

import LoadingNostrLink from "../../components/loading-nostr-link";
import TextNoteContents from "../../components/note/timeline-note/text-note-contents";
import Timestamp from "../../components/timestamp";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserDnsIdentityIcon from "../../components/user/user-dns-identity-icon";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useReadRelays } from "../../hooks/use-client-relays";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useMaxPageWidth from "../../hooks/use-max-page-width";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import useThreadTimelineLoader from "../../hooks/use-thread-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import { getSharableEventAddress } from "../../services/relay-hints";
import { ExpandableToggleButton } from "../notifications/components/notification-item";
import ThreadPost from "./components/thread-post";

function ParentNote({ note, level = 0 }: { note: NostrEvent; level?: number }) {
  const ref = useEventIntersectionRef(note);
  const more = useDisclosure({ defaultIsOpen: level < 2 });

  return (
    <LinkBox
      gap="2"
      overflow="hidden"
      p="2"
      flexShrink={0}
      borderWidth="0 2px 0 2px"
      rounded="none"
      borderColor="var(--chakra-colors-chakra-border-color)"
      ref={ref}
      role="article"
    >
      <ExpandableToggleButton
        toggle={more}
        aria-label={more.isOpen ? "Collapse post" : "Expand post"}
        size="sm"
        float="right"
      />
      <Box float="left" mr="2">
        <UserAvatarLink pubkey={note.pubkey} size="xs" mr="2" aria-label="avatar" />
        <UserLink pubkey={note.pubkey} fontWeight="bold" mr="1" />
        <UserDnsIdentityIcon pubkey={note.pubkey} mr="2" />
        <Link
          as={RouterLink}
          to={`/n/${getSharableEventAddress(note)}`}
          aria-label={`Posted at ${new Date(note.created_at * 1000).toLocaleString()}`}
        >
          <Timestamp timestamp={note.created_at} />
        </Link>
      </Box>
      {more.isOpen ? (
        <ContentSettingsProvider blurMedia={false}>
          <br />
          <TextNoteContents event={note} aria-expanded="true" />
        </ContentSettingsProvider>
      ) : (
        <Link
          as={RouterLink}
          to={`/n/${getSharableEventAddress(note)}`}
          noOfLines={1}
          fontStyle="italic"
          aria-expanded="false"
        >
          {note.content}
        </Link>
      )}
    </LinkBox>
  );
}

function Parents({ pointer, thread }: { pointer: nip19.EventPointer; thread: Thread }) {
  const posts: ReactNode[] = [];

  let level = 0;
  let cursor: EventPointer | undefined = pointer;
  while (cursor) {
    const post = thread.all.get(cursor.id);

    if (post) {
      posts.unshift(<ParentNote note={post.event} key={post.event.id} level={level} />);
      // attempt to walk up the "e" reply tree
      cursor = getNip10References(post.event).reply?.e;
      level++;
    } else {
      // failed to find parent post, append loading and done
      posts.unshift(<LoadingNostrLink link={{ type: "nevent", data: cursor }} key={cursor.id} />);
      cursor = undefined;
    }
  }

  return <>{posts}</>;
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

  const parent = getNip10References(focusedPost.event).reply?.e;

  return (
    <>
      {parent && <Parents pointer={parent} thread={thread} />}
      <ThreadPost post={focusedPost} initShowReplies focusId={focusId} />
    </>
  );
}

export default function ThreadView() {
  const pointer = useParamsEventPointer("id");
  const readRelays = useReadRelays(pointer.relays);

  const focusedEvent = useSingleEvent(pointer);
  const { rootPointer, timeline } = useThreadTimelineLoader(focusedEvent, readRelays);
  const thread = useEventModel(ThreadModel, rootPointer ? [rootPointer] : undefined);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  const maxWidth = useMaxPageWidth("6xl");
  return (
    <VerticalPageLayout maxW={maxWidth} mx="auto" w="full">
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
