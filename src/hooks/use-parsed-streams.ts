import { useMemo } from "react";
import { NostrEvent } from "../types/nostr-event";
import { ParsedStream, parseStreamEvent } from "../helpers/nostr/stream";

export default function useParsedStreams(events: NostrEvent[]) {
  return useMemo(() => {
    const parsedStreams: ParsedStream[] = [];
    for (const event of events) {
      try {
        const parsed = parseStreamEvent(event);
        parsedStreams.push(parsed);
      } catch (e) {}
    }
    return parsedStreams.sort((a, b) => (b.starts ?? 0) - (a.starts ?? 0));
  }, [events]);
}
