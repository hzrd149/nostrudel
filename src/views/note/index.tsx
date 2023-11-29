import { useEffect, useMemo } from "react";
import { Button, Code, Heading, Spinner } from "@chakra-ui/react";
import { Kind, nip19 } from "nostr-tools";
import { useParams, Link as RouterLink } from "react-router-dom";

import Note from "../../components/note";
import { getSharableEventAddress, isHexKey } from "../../helpers/nip19";
import { ThreadPost } from "./components/thread-post";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useSingleEvent from "../../hooks/use-single-event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { getReferences } from "../../helpers/nostr/events";
import useSubject from "../../hooks/use-subject";
import { ThreadItem, buildThread } from "../../helpers/thread";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import singleEventService from "../../services/single-event";

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

export default function ThreadView() {
  const pointer = useNotePointer();
  const readRelays = useReadRelayUrls(pointer.relays);

  // load the event in focus
  const focused = useSingleEvent(pointer.id, pointer.relays);
  const refs = focused && getReferences(focused);
  const rootId = refs ? refs.rootId || pointer.id : undefined;

  const timelineId = `${rootId}-replies`;
  const timeline = useTimelineLoader(
    timelineId,
    readRelays,
    rootId
      ? {
          "#e": [rootId],
          kinds: [Kind.Text],
        }
      : undefined,
  );

  const events = useSubject(timeline.timeline);

  // mirror all events to single event cache
  useEffect(() => {
    for (const e of events) singleEventService.handleEvent(e);
  }, [events]);

  const rootEvent = useSingleEvent(rootId, refs?.rootRelay ? [refs.rootRelay] : []);
  const thread = useMemo(() => {
    return rootEvent ? buildThread([...events, rootEvent]) : buildThread(events);
  }, [events, rootEvent]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout px={{ base: 0, md: "2" }}>
      {!focused && (
        <Heading mx="auto" my="4">
          <Spinner /> Loading note
        </Heading>
      )}
      {/* <Code as="pre">
        {JSON.stringify({ pointer, rootId, focused: focused?.id, refs, timelineId, events: events.length }, null, 2)}
      </Code> */}
      <IntersectionObserverProvider callback={callback}>
        {focused && rootId ? <ThreadPage thread={thread} rootId={rootId} focusId={focused.id} /> : <Spinner />}
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
