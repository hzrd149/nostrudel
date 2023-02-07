import {
  Button,
  IconButton,
  IconButtonProps,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { NostrRequest } from "../../classes/nostr-request";
import useSubject from "../../hooks/use-subject";
import { getEventRelays } from "../../services/event-relays";
import settings from "../../services/settings";
import { NostrEvent } from "../../types/nostr-event";
import { RelayIcon } from "../icons";

export type NoteRelaysProps = Omit<IconButtonProps, "icon" | "aria-label"> & {
  event: NostrEvent;
};

export const NoteRelays = ({ event, ...props }: NoteRelaysProps) => {
  const relays = useSubject(getEventRelays(event.id));

  const [loading, setLoading] = useState(false);
  const queryRelays = useCallback(() => {
    setLoading(true);
    const request = new NostrRequest(settings.relays.value);
    request.start({ ids: [event.id] });
    request.onEvent.subscribe({
      complete() {
        setLoading(false);
      },
    });
  }, []);

  return (
    <Popover>
      <PopoverTrigger>
        <IconButton title="Note Relays" icon={<RelayIcon />} {...props} aria-label="Note Relays" />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          {relays.map((url) => (
            <Text key={url}>{url}</Text>
          ))}
          <Button size="xs" onClick={queryRelays} isLoading={loading}>
            Search
          </Button>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
