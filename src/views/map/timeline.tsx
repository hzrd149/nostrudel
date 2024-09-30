import React from "react";
import { kinds } from "nostr-tools";

import { ErrorBoundary } from "../../components/error-boundary";
import useSubject from "../../hooks/use-subject";
import StreamNote from "../../components/timeline-page/generic-note-timeline/stream-note";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import TimelineLoader from "../../classes/timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import TimelineNote from "../../components/note/timeline-note";

const RenderEvent = React.memo(({ event, focused }: { event: NostrEvent; focused?: boolean }) => {
  switch (event.kind) {
    case kinds.ShortTextNote:
      return <TimelineNote event={event} variant={focused ? "elevated" : undefined} />;
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
        <ErrorBoundary key={event.id} event={event}>
          <RenderEvent event={event} focused={focused === event.id} />
        </ErrorBoundary>
      ))}
    </>
  );
});

export default MapTimeline;
