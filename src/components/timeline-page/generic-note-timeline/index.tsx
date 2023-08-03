import React from "react";
import useSubject from "../../../hooks/use-subject";
import { TimelineLoader } from "../../../classes/timeline-loader";
import RepostNote from "./repost-note";
import { Note } from "../../note";
import { NostrEvent } from "../../../types/nostr-event";
import { Text } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import { STREAM_KIND } from "../../../helpers/nostr/stream";
import StreamNote from "./stream-note";
import { ErrorBoundary } from "../../error-boundary";

const RenderEvent = React.memo(({ event }: { event: NostrEvent }) => {
  switch (event.kind) {
    case Kind.Text:
      return <Note event={event} />;
    case Kind.Repost:
      return <RepostNote event={event} />;
    case STREAM_KIND:
      return <StreamNote event={event} />;
    default:
      return <Text>Unknown event kind: {event.kind}</Text>;
  }
});

const GenericNoteTimeline = React.memo(({ timeline }: { timeline: TimelineLoader }) => {
  const notes = useSubject(timeline.timeline);

  return (
    <>
      {notes.map((note) => (
        <ErrorBoundary key={note.id}>
          <RenderEvent event={note} />
        </ErrorBoundary>
      ))}
    </>
  );
});

export default GenericNoteTimeline;
