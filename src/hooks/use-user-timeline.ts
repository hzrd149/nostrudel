import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { NostrEvent } from "../types/nostr-event";
import { useEventDir } from "./use-event-dir";
import { useSubscription } from "./use-subscription";

export function useUserTimeline(pubkey: string, filter?: (event: NostrEvent) => boolean) {
  const [until, setUntil] = useState<number | undefined>(undefined);
  const [since, setSince] = useState<number>(moment().subtract(1, "day").startOf("day").unix());

  const sub = useSubscription({ authors: [pubkey], kinds: [1], since, until }, { name: `${pubkey} posts` });

  const eventDir = useEventDir(sub, filter);

  const reset = useCallback(() => {
    setUntil(undefined);
    setSince(moment().subtract(1, "day").startOf("day").unix());
    eventDir.reset();
  }, [eventDir.reset, setUntil, setSince]);

  // clear events when pubkey changes
  useEffect(() => reset(), [pubkey]);

  const timeline = Object.values(eventDir.events).sort((a, b) => b.created_at - a.created_at);

  const more = useCallback(
    (days: number) => {
      setUntil(since);
      setSince(moment.unix(since).add(days, "days").unix());
    },
    [setSince, setUntil, since]
  );

  return {
    timeline,
    reset,
    more,
  };
}
