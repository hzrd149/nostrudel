import { Kind } from "nostr-tools";
import React from "react";
import { ErrorBoundary } from "../../components/error-boundary";
import useSubject from "../../hooks/use-subject";
import StreamNote from "../../components/timeline-page/generic-note-timeline/stream-note";
import { Note } from "../../components/note";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import TimelineLoader from "../../classes/timeline-loader";
import { NostrEvent } from "../../types/nostr-event";

const RenderEvent = React.memo(({ event, focused }: { event: NostrEvent; focused?: boolean }) => {
  switch (event.kind) {
    case Kind.Text:
      return <Note event={event} variant={focused ? "elevated" : undefined} />;
    case STREAM_KIND:
      return <StreamNote event={event} />;
    default:
      return null;
  }
});

const MapTimeline = React.memo(({ timeline, focused }: { timeline: TimelineLoader; focused?: string }) => {
  const events = useSubject(timeline.timeline);

  return (
    <>
      {events.map((event) => (
        <ErrorBoundary key={event.id}>
          <RenderEvent event={event} focused={focused === event.id} />
        </ErrorBoundary>
      ))}
    </>
  );
});

export default MapTimeline;
