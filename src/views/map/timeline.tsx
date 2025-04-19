import React from "react";
import { kinds } from "nostr-tools";

import { ErrorBoundary } from "../../components/error-boundary";
import StreamNote from "../../components/timeline-page/generic-note-timeline/stream-note";
import { NostrEvent } from "nostr-tools";
import TimelineNote from "../../components/note/timeline-note";

const RenderEvent = React.memo(({ event, focused }: { event: NostrEvent; focused?: boolean }) => {
  switch (event.kind) {
    case kinds.ShortTextNote:
      return <TimelineNote event={event} variant={focused ? "elevated" : undefined} />;
    case kinds.LiveEvent:
      return <StreamNote stream={event} />;
    default:
      return null;
  }
});

const MapTimeline = React.memo(({ timeline, focused }: { timeline: NostrEvent[]; focused?: string }) => {
  return (
    <>
      {timeline?.map((event) => (
        <ErrorBoundary key={event.id} event={event}>
          <RenderEvent event={event} focused={focused === event.id} />
        </ErrorBoundary>
      ))}
    </>
  );
});

export default MapTimeline;
