import { useMemo } from "react";
import { NostrEvent } from "../types/nostr-event";
import relayHintService from "../services/event-relay-hint";
import useUserMailboxes from "./use-user-mailboxes";

export default function useShareableEventAddress(event: NostrEvent, overrideRelays?: string[]) {
  const mailboxes = useUserMailboxes(event.pubkey);

  return useMemo(() => {
    return relayHintService.getSharableEventAddress(event, overrideRelays);
  }, [event]);
}
