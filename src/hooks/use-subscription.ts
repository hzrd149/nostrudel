import { useRef } from "react";
import { useMount, useUnmount } from "react-use";
import { NostrSubscription } from "../classes/nostr-subscription";
import { NostrQuery } from "../types/nostr-query";

/** @deprecated */
export function useSubscription(
  urls: string[],
  query: NostrQuery,
  name?: string
) {
  const sub = useRef<NostrSubscription | null>(null);
  sub.current = sub.current || new NostrSubscription(urls, query, name);

  useMount(() => {
    if (sub.current) sub.current.open();
  });
  useUnmount(() => {
    if (sub.current) {
      sub.current.close();
      sub.current = null;
    }
  });

  return sub.current as NostrSubscription;
}
