import { memo } from "react";

import { NostrEvent } from "../../../types/nostr-event";
import TimelineNote from "../../note/timeline-note";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

function ReplyNote({ event }: { event: NostrEvent }) {
  const ref = useEventIntersectionRef(event);

  return (
    <div ref={ref}>
      <TimelineNote event={event} showReplyButton showReplyLine />
    </div>
  );
}
export default memo(ReplyNote);
