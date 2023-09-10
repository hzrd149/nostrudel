import { useEffect, useState } from "react";

import { GOAL_KIND } from "../helpers/nostr/goal";
import { ParsedStream, getATag } from "../helpers/nostr/stream";
import { NostrEvent } from "../types/nostr-event";
import { useReadRelayUrls } from "./use-client-relays";
import singleEventService from "../services/single-event";
import { NostrRequest } from "../classes/nostr-request";

export default function useStreamGoal(stream: ParsedStream) {
  const [goal, setGoal] = useState<NostrEvent>();
  const relays = useReadRelayUrls(stream.relays);

  useEffect(() => {
    if (stream.goal) {
      singleEventService.requestEvent(stream.goal, relays).then((event) => {
        setGoal(event);
      });
    } else {
      const request = new NostrRequest(relays);
      request.onEvent.subscribe((event) => {
        setGoal(event);
      });
      request.start({ "#a": [getATag(stream)], kinds: [GOAL_KIND] });
    }
  }, [stream.identifier, stream.goal, relays.join("|")]);

  return goal;
}
