import { Heading, Spinner } from "@chakra-ui/react";
import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { eventMatchesPointer } from "applesauce-core/helpers";

import { ErrorBoundary } from "../../components/error-boundary";
import LoadingNostrLink from "../../components/loading-nostr-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import {
  getThreadParent,
  getThreadScopeKey,
  isExternalThreadScope,
  ThreadEvent,
  ThreadScope,
} from "../../helpers/nostr/thread";
import { useReadRelays } from "../../hooks/use-client-relays";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import useThreadEvent from "../../hooks/use-thread-event";
import useThreadTimelineLoader from "../../hooks/use-thread-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { ThreadRepliesModel } from "../../models/thread-replies";
import { repliesByDate } from "./helpers";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import ParentPost from "./components/parent-post";
import ThreadPost from "./components/thread-post";
import ThreadScopePreview from "./components/thread-scope";

/** Load one ancestor per level through the shared store, stopping at the separately rendered root. */
function ParentChain({
  note,
  root,
  level = 0,
  seen = [],
}: {
  note: ThreadEvent;
  root: ThreadScope;
  level?: number;
  seen?: string[];
}) {
  const pointer = getThreadParent(note.event);
  const parentEvent = useSingleEvent(pointer && !isExternalThreadScope(pointer) ? pointer : undefined);
  const parentNote = useThreadEvent(parentEvent);

  if (!pointer || getThreadScopeKey(pointer) === getThreadScopeKey(root)) return null;
  if (parentEvent && (parentEvent.id === note.id || seen.includes(parentEvent.id))) return null;
  if (parentEvent && !isExternalThreadScope(root) && eventMatchesPointer(parentEvent, root)) return null;
  if (!parentEvent) return <ThreadScopePreview scope={pointer} />;

  return (
    <>
      {parentNote && <ParentChain note={parentNote} root={root} level={level + 1} seen={[...seen, note.id]} />}
      <ErrorBoundary event={parentEvent}>
        <ParentPost event={parentEvent} level={level} />
      </ErrorBoundary>
    </>
  );
}

function RootReplies({ event }: { event: NostrEvent }) {
  const replies = useEventModel(ThreadRepliesModel, [event]);
  return (
    <>
      {repliesByDate(replies ?? []).map((reply) => (
        <ThreadPost key={reply.id} note={reply} level={0} ancestors={[event.id]} />
      ))}
    </>
  );
}

export default function ThreadView() {
  const pointer = useParamsEventPointer("id");
  const readRelays = useReadRelays(pointer.relays);
  const focusedEvent = useSingleEvent(pointer);
  const { root, rootPointer, loader } = useThreadTimelineLoader(focusedEvent, readRelays);
  const rootEvent = useSingleEvent(rootPointer);
  const focusedNote = useThreadEvent(focusedEvent);
  const callback = useTimelineCurserIntersectionCallback(loader);
  const showRoot = root && focusedEvent && (isExternalThreadScope(root) || !eventMatchesPointer(focusedEvent, root));

  return (
    <VerticalPageLayout maxW="6xl" mx="auto" w="full">
      {!focusedEvent && (
        <>
          <Heading my="4">
            <Spinner /> Loading post
          </Heading>
          <LoadingNostrLink link={{ type: "nevent", data: pointer }} />
        </>
      )}
      <IntersectionObserverProvider callback={callback}>
        <ErrorBoundary event={focusedEvent}>
          {showRoot && (
            <ErrorBoundary event={rootEvent}>
              <ThreadScopePreview scope={root} event={rootEvent} />
            </ErrorBoundary>
          )}
          {focusedNote && root && (
            <>
              <ParentChain note={focusedNote} root={root} />
              <ThreadPost key={focusedNote.id} note={focusedNote} initShowReplies focusId={focusedNote.id} />
            </>
          )}
          {focusedEvent && !focusedNote && (
            <>
              <ParentPost event={focusedEvent} level={0} />
              <RootReplies event={focusedEvent} />
            </>
          )}
        </ErrorBoundary>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}
