import { memo } from "react";
import { useBreakpointValue } from "@chakra-ui/react";

import { getEventRelays } from "../../services/event-relays";
import { NostrEvent } from "../../types/nostr-event";
import useSubject from "../../hooks/use-subject";
import { RelayIconStack, RelayIconStackProps } from "../relay-icon-stack";
import { getEventUID } from "../../helpers/nostr/events";

export type NoteRelaysProps = {
  event: NostrEvent;
};

export const EventRelays = memo(({ event }: NoteRelaysProps & Omit<RelayIconStackProps, "relays" | "maxRelays">) => {
  const maxRelays = useBreakpointValue({ base: 3, md: undefined });
  const eventRelays = useSubject(getEventRelays(getEventUID(event)));

  return <RelayIconStack relays={eventRelays} direction="row-reverse" maxRelays={maxRelays} />;
});
