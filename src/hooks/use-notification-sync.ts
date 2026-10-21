import { use$ } from "applesauce-react/hooks";
import { useEffect, useMemo } from "react";
import { asapScheduler, subscribeOn } from "rxjs";

import { notificationSync, NotificationDomain } from "../services/notifications/sync";

export default function useNotificationSync(domain: NotificationDomain, since?: number) {
  // use$ probes subscriptions during render; defer acquisition until the committed subscription.
  const source = useMemo(() => notificationSync[domain].pipe(subscribeOn(asapScheduler)), [domain]);
  const state = use$(source);
  const ensureSince = state?.ensureSince;
  useEffect(() => {
    if (since !== undefined) ensureSince?.(since);
  }, [since, ensureSince]);
  return state;
}
