import { memo } from "react";
import { IconButtonProps } from "@chakra-ui/react";
import { getEventRelays } from "../../services/event-relays";
import { NostrEvent } from "../../types/nostr-event";
import useSubject from "../../hooks/use-subject";
import { RelayIconStack } from "../relay-icon-stack";
import { useIsMobile } from "../../hooks/use-is-mobile";

export type NoteRelaysProps = {
  event: NostrEvent;
};

export const NoteRelays = memo(({ event }: NoteRelaysProps) => {
  const isMobile = useIsMobile();
  const eventRelays = useSubject(getEventRelays(event.id));

  return <RelayIconStack relays={eventRelays} direction="row-reverse" maxRelays={isMobile ? 4 : undefined} />;
});
