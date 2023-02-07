import { useRef } from "react";
import { useDeepCompareEffect, useMount, useUnmount } from "react-use";
import { Subscription } from "../services/subscriptions";

export function useSubscription(urls, query, name) {
  const sub = useRef(null);
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

  return sub.current;
}
