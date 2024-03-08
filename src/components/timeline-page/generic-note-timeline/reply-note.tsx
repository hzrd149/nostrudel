import { memo, useRef } from "react";

import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/local/intersection-observer";
import TimelineNote from "../../note/timeline-note";
import { getEventUID } from "nostr-idb";

function ReplyNote({ event }: { event: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <div ref={ref}>
      <TimelineNote event={event} showReplyButton showReplyLine />
    </div>
  );
}
export default memo(ReplyNote);
