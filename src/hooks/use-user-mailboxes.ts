import { MailboxesModel } from "applesauce-core/models";
import { useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { ProfilePointer } from "nostr-tools/nip19";
import { useMemo } from "react";
import { liveness } from "../services/pool";
import localSettings from "../services/preferences";

export default function useUserMailboxes(user?: string | ProfilePointer) {
  return useEventModel(MailboxesModel, user ? [user] : undefined);
}

/** Gets the users inboxes and filters out unhealthy relays */
export function useUserInbox(pubkey?: string | ProfilePointer): string[] | undefined {
  const unhealthy = useObservableEagerState(liveness.unhealthy$);
  const mailboxes = useUserMailboxes(pubkey);

  return useMemo(() => {
    if (!mailboxes) return undefined;
    return mailboxes.inboxes.filter((relay) => !unhealthy.includes(relay));
  }, [mailboxes, unhealthy]);
}

/** Gets the users outboxes or uses fallback relays and filters out unhealthy relays */
export function useUserOutbox(pubkey?: string | ProfilePointer): string[] | undefined {
  const fallbacks = useObservableEagerState(localSettings.fallbackRelays);
  const unhealthy = useObservableEagerState(liveness.unhealthy$);
  const mailboxes = useUserMailboxes(pubkey);

  return useMemo(() => {
    if (!mailboxes) return fallbacks.filter((relay) => !unhealthy.includes(relay));
    return mailboxes.outboxes.filter((relay) => !unhealthy.includes(relay));
  }, [mailboxes, unhealthy, fallbacks]);
}
