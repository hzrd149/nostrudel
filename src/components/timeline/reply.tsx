import { NostrEvent } from "nostr-tools";

import TimelineNote from "./note";

export default function ReplyNote({ event }: { event: NostrEvent }) {
  return <TimelineNote event={event} showReplyButton showReplyLine />;
}
