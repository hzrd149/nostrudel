import { useEffect, useState } from "react";

import { GOAL_KIND } from "../helpers/nostr/goal";
import { ParsedStream, getATag } from "../helpers/nostr/stream";
import { NostrEvent } from "../types/nostr-event";
import { useReadRelayUrls } from "./use-client-relays";
import NostrRequest from "../classes/nostr-request";
import useSingleEvent from "./use-single-event";

export default function useStreamGoal(stream: ParsedStream) {
  const [goal, setGoal] = useState<NostrEvent>();
  const relays = useReadRelayUrls(stream.relays);

  const streamGoal = useSingleEvent(stream.goal);

  useEffect(() => {
    if (!stream.goal) {
      const request = new NostrRequest(relays);
      request.onEvent.subscribe((event) => {
        setGoal(event);
      });
      request.start({ "#a": [getATag(stream)], kinds: [GOAL_KIND] });
    }
  }, [stream.identifier, stream.goal, relays.join("|")]);

  return streamGoal || goal;
}
