import { NostrEvent } from "nostr-tools";
import { memo } from "react";

import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import TimelineNote from "../../timeline/note";

function ReplyNote({ event }: { event: NostrEvent }) {
  const ref = useEventIntersectionRef(event);

  return (
    <div ref={ref}>
      <TimelineNote event={event} showReplyButton showReplyLine />
    </div>
  );
}
export default memo(ReplyNote);
