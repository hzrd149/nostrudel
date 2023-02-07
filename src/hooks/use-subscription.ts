import { useRef } from "react";
import { useDeepCompareEffect, useMount, useUnmount } from "react-use";
import { Subscription } from "../services/subscriptions";
import { NostrQuery } from "../types/nostr-query";

export function useSubscription(
  urls: string[],
  query: NostrQuery,
  name?: string
) {
  const sub = useRef<Subscription | null>(null);
  sub.current = sub.current || new Subscription(urls, query, name);

  useMount(() => {
    if (sub.current) sub.current.open();
  });
  useDeepCompareEffect(() => {
    if (sub.current) sub.current.setQuery(query);
  }, [query]);
  useUnmount(() => {
    if (sub.current) sub.current.close();
  });

  return sub.current as Subscription;
}
