import { useEffect, useState } from "react";

import { GOAL_KIND } from "../helpers/nostr/goal";
import { ParsedStream, getATag } from "../helpers/nostr/stream";
import { NostrEvent } from "../types/nostr-event";
import { useReadRelays } from "./use-client-relays";
import useSingleEvent from "./use-single-event";
import { subscribeMany } from "../helpers/relay";
import { Filter } from "nostr-tools";

export default function useStreamGoal(stream: ParsedStream) {
  const [goal, setGoal] = useState<NostrEvent>();
  const readRelays = useReadRelays(stream.relays);

  const streamGoal = useSingleEvent(stream.goal);

  useEffect(() => {
    if (!stream.goal) {
      const filter: Filter = { "#a": [getATag(stream)], kinds: [GOAL_KIND] };
      const sub = subscribeMany(Array.from(readRelays), [filter], {
        onevent: (event) => setGoal((c) => (!c || event.created_at > c.created_at ? event : c)),
        oneose: () => sub.close(),
      });
    }
  }, [stream.identifier, stream.goal, readRelays.urls.join("|")]);

  return streamGoal || goal;
}
