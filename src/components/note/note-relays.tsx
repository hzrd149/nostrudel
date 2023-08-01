import { memo } from "react";
import { getEventRelays } from "../../services/event-relays";
import { NostrEvent } from "../../types/nostr-event";
import useSubject from "../../hooks/use-subject";
import { RelayIconStack } from "../relay-icon-stack";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { getEventUID } from "../../helpers/nostr/event";

export type NoteRelaysProps = {
  event: NostrEvent;
};

export const NoteRelays = memo(({ event }: NoteRelaysProps) => {
  const isMobile = useIsMobile();
  const eventRelays = useSubject(getEventRelays(getEventUID(event)));

  return <RelayIconStack relays={eventRelays} direction="row-reverse" maxRelays={isMobile ? 4 : undefined} />;
});
