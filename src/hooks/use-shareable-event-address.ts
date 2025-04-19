import { useMemo } from "react";
import { NostrEvent } from "nostr-tools";
import { getSharableEventAddress } from "../services/relay-hints";
import useUserMailboxes from "./use-user-mailboxes";

export default function useShareableEventAddress(event: NostrEvent, overrideRelays?: string[]) {
  // Load the mailboxes for the event
  useUserMailboxes(event.pubkey);

  return useMemo(() => {
    return getSharableEventAddress(event, overrideRelays);
  }, [event]);
}
