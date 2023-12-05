import { useMemo } from "react";
import { Button, Heading, Spinner } from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { useParams, Link as RouterLink } from "react-router-dom";

import Note from "../../components/note";
import { getSharableEventAddress, isHexKey } from "../../helpers/nip19";
import { ThreadPost } from "./components/thread-post";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { ThreadItem, buildThread } from "../../helpers/thread";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useThreadTimelineLoader from "../../hooks/use-thread-timeline-loader";
import useSingleEvent from "../../hooks/use-single-event";

function ThreadPage({ thread, rootId, focusId }: { thread: Map<string, ThreadItem>; rootId: string; focusId: string }) {
  const isRoot = rootId === focusId;

  const focusedPost = thread.get(focusId);
  const rootPost = thread.get(rootId);
  if (isRoot && rootPost) {
    return <ThreadPost post={rootPost} initShowReplies focusId={focusId} />;
  }

  if (!focusedPost) return null;

  const parentPosts = [];
  if (focusedPost.reply) {
    let p = focusedPost;
    while (p.reply) {
      parentPosts.unshift(p.reply);
      p = p.reply;
    }
  }

  return (
    <>
      {parentPosts.length > 1 && (
        <Button
          variant="outline"
          size="lg"
          h="4rem"
          w="full"
          as={RouterLink}
          to={`/n/${getSharableEventAddress(parentPosts[0].event)}`}
        >
          View full thread ({parentPosts.length - 1})
        </Button>
      )}
      {focusedPost.reply && (
        <Note
          key={focusedPost.reply.event.id + "-rely"}
          event={focusedPost.reply.event}
          hideDrawerButton
          showReplyLine={false}
        />
      )}
      <ThreadPost key={focusedPost.event.id} post={focusedPost} initShowReplies focusId={focusId} />
    </>
  );
}

function useNotePointer() {
  const { id } = useParams() as { id: string };
  if (isHexKey(id)) return { id, relays: [] };
  const pointer = nip19.decode(id);

  switch (pointer.type) {
    case "note":
      return { id: pointer.data as string, relays: [] };
    case "nevent":
      return { id: pointer.data.id, relays: pointer.data.relays ?? [] };
    default:
      throw new Error(`Unknown type ${pointer.type}`);
  }
}

export default function ThreadView() {
  const pointer = useNotePointer();
  const readRelays = useReadRelayUrls(pointer.relays);

  const focusedEvent = useSingleEvent(pointer.id, pointer.relays);
  const { rootId, events, timeline } = useThreadTimelineLoader(focusedEvent, readRelays);
  const thread = useMemo(() => buildThread(events), [events]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout px={{ base: 0, md: "2" }}>
      {!focusedEvent && (
        <Heading mx="auto" my="4">
          <Spinner /> Loading note
        </Heading>
      )}
      {/* <Code as="pre">
        {JSON.stringify({ pointer, rootId, focused: focusedEvent?.id, refs, timelineId, events: events.length }, null, 2)}
      </Code> */}
      <IntersectionObserverProvider callback={callback}>
        {focusedEvent && rootId ? (
          <ThreadPage thread={thread} rootId={rootId} focusId={focusedEvent.id} />
        ) : (
          <Spinner />
        )}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
