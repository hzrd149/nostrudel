import { useMemo } from "react";
import { NostrEvent } from "../types/nostr-event";
import { getSharableEventAddress } from "../services/relay-hints";
import useUserMailboxes from "./use-user-mailboxes";

export default function useShareableEventAddress(event: NostrEvent, overrideRelays?: string[]) {
  const mailboxes = useUserMailboxes(event.pubkey);

  return useMemo(() => {
    return getSharableEventAddress(event, overrideRelays);
  }, [event]);
}
