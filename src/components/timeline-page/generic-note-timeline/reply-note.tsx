import { memo, useRef } from "react";

import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import Note from "../../note";

function ReplyNote({ event }: { event: NostrEvent }) {
  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

  return (
    <div ref={ref}>
      <Note event={event} showReplyButton showReplyLine />
    </div>
  );
}
export default memo(ReplyNote);
