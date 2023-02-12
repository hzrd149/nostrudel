import { useRef } from "react";
import { useDeepCompareEffect, useUnmount } from "react-use";
import { NostrMultiSubscription } from "../classes/nostr-multi-subscription";
import { NostrQuery } from "../types/nostr-query";
import { useReadRelayUrls } from "./use-client-relays";

type Options = {
  name?: string;
  enabled?: boolean;
};

/** @deprecated */
export function useSubscription(query: NostrQuery, opts?: Options) {
  const relays = useReadRelayUrls();
  const sub = useRef<NostrMultiSubscription | null>(null);
  sub.current = sub.current || new NostrMultiSubscription(relays, undefined, opts?.name);

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

  return sub.current as NostrMultiSubscription;
}
