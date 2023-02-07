import { useRef } from "react";
import { useDeepCompareEffect, useUnmount } from "react-use";
import { NostrSubscription } from "../classes/nostr-subscription";
import settings from "../services/settings";
import { NostrQuery } from "../types/nostr-query";
import useSubject from "./use-subject";

type Options = {
  name?: string;
  enabled?: boolean;
};

export function useSubscription(query: NostrQuery, opts?: Options) {
  const relays = useSubject(settings.relays);
  const sub = useRef<NostrSubscription | null>(null);
  sub.current = sub.current || new NostrSubscription(relays, undefined, opts?.name);

  useDeepCompareEffect(() => {
    if (sub.current) {
      sub.current.setQuery(query);
      if (opts?.enabled ?? true) sub.current.open();
      else sub.current.close();
    }
  }, [query]);
  useUnmount(() => {
    if (sub.current) {
      sub.current.close();
      sub.current = null;
    }
  });

  return sub.current as NostrSubscription;
}
