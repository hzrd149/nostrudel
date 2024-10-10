import React from "react";
import { kinds } from "nostr-tools";

import { ErrorBoundary } from "../../components/error-boundary";
import StreamNote from "../../components/timeline-page/generic-note-timeline/stream-note";
import TimelineLoader from "../../classes/timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import TimelineNote from "../../components/note/timeline-note";
import { useObservable } from "applesauce-react";

const RenderEvent = React.memo(({ event, focused }: { event: NostrEvent; focused?: boolean }) => {
  switch (event.kind) {
    case kinds.ShortTextNote:
      return <TimelineNote event={event} variant={focused ? "elevated" : undefined} />;
    case kinds.LiveEvent:
      return <StreamNote event={event} />;
    default:
      return null;
  }
});

const MapTimeline = React.memo(({ timeline, focused }: { timeline: TimelineLoader; focused?: string }) => {
  const events = useObservable(timeline.timeline);

  return (
    <>
      {events?.map((event) => (
        <ErrorBoundary key={event.id} event={event}>
          <RenderEvent event={event} focused={focused === event.id} />
        </ErrorBoundary>
      ))}
    </>
  );
});

export default MapTimeline;
