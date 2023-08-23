import { memo } from "react";
import { getEventRelays } from "../../services/event-relays";
import { NostrEvent } from "../../types/nostr-event";
import useSubject from "../../hooks/use-subject";
import { RelayIconStack } from "../relay-icon-stack";
import { getEventUID } from "../../helpers/nostr/events";
import { useBreakpointValue } from "@chakra-ui/react";

export type NoteRelaysProps = {
  event: NostrEvent;
};

export const EventRelays = memo(({ event }: NoteRelaysProps) => {
  const maxRelays = useBreakpointValue({ base: 3, md: undefined });
  const eventRelays = useSubject(getEventRelays(getEventUID(event)));

  return <RelayIconStack relays={eventRelays} direction="row-reverse" maxRelays={maxRelays} />;
});
