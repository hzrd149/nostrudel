import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { useEventDir } from "./use-event-dir";
import { useSubscription } from "./use-subscription";

type Options = {
  filter?: (event: NostrEvent) => boolean;
  name?: string;
  enabled?: boolean;
  initialSince?: number;
  pageSize?: number;
};

export function useEventTimelineLoader(query: Omit<NostrQuery, "since" | "until">, opts?: Options) {
  const enabled = opts?.enabled ?? true;
  const pageSize = opts?.pageSize ?? moment.duration(1, "day").asSeconds();
  const [until, setUntil] = useState<number | undefined>(undefined);
  const [since, setSince] = useState<number>(opts?.initialSince ?? moment().subtract(1, "day").unix());

  const sub = useSubscription({ ...query, since, until }, { name: opts?.name, enabled });

  const eventDir = useEventDir(sub, opts?.filter);

  const reset = useCallback(() => {
    setUntil(undefined);
    setSince(opts?.initialSince ?? moment().subtract(1, "day").startOf("day").unix());
    eventDir.reset();
  }, [eventDir.reset, setUntil, setSince]);

  // clear events when pubkey changes
  useEffect(() => reset(), [opts?.name, reset]);

  const timeline = useMemo(
    () => Object.values(eventDir.events).sort((a, b) => b.created_at - a.created_at),
    [eventDir.events]
  );

  const more = useCallback(
    (days: number) => {
      setUntil(since);
      setSince(since + pageSize);
    },
    [setSince, setUntil, since]
  );

  return {
    timeline,
    reset,
    more,
  };
}
