import { memo } from "react";
import { IconButton, IconButtonProps, Flex, useDisclosure } from "@chakra-ui/react";
import { getEventRelays } from "../../services/event-relays";
import { NostrEvent } from "../../types/nostr-event";
import { RelayIcon } from "../icons";
import { RelayFavicon } from "../relay-favicon";
import useSubject from "../../hooks/use-subject";
import { useIsMobile } from "../../hooks/use-is-mobile";

export type NoteRelaysProps = Omit<IconButtonProps, "icon" | "aria-label"> & {
  event: NostrEvent;
};

export const NoteRelays = memo(({ event, ...props }: NoteRelaysProps) => {
  const isMobile = useIsMobile();
  const eventRelays = useSubject(getEventRelays(event.id));
  const { isOpen, onOpen } = useDisclosure();

  return isOpen || !isMobile ? (
    <Flex alignItems="center" gap="-4">
      {eventRelays.map((url) => (
        <RelayFavicon key={url} relay={url} size="2xs" title={url} />
      ))}
    </Flex>
  ) : (
    <IconButton icon={<RelayIcon />} size="xs" aria-label="Relays" onClick={onOpen} variant="link" />
  );
});
