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
  Flex,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { nostrPostAction } from "../../classes/nostr-post-action";
import { NostrRequest } from "../../classes/nostr-request";
import useSubject from "../../hooks/use-subject";
import { getEventRelays, handleEventFromRelay } from "../../services/event-relays";
import { relayPool } from "../../services/relays";
import settings from "../../services/settings";
import { NostrEvent } from "../../types/nostr-event";
import { RelayIcon } from "../icons";

export type NoteRelaysProps = Omit<IconButtonProps, "icon" | "aria-label"> & {
  event: NostrEvent;
};

export const NoteRelays = ({ event, ...props }: NoteRelaysProps) => {
  const relays = useSubject(getEventRelays(event.id));

  const [querying, setQuerying] = useState(false);
  const queryRelays = useCallback(() => {
    setQuerying(true);
    const request = new NostrRequest(settings.relays.value);
    request.start({ ids: [event.id] });
    request.onEvent.subscribe({
      complete() {
        setQuerying(false);
      },
    });
  }, []);

  const [broadcasting, setBroadcasting] = useState(false);
  const broadcast = useCallback(() => {
    const missingRelays = settings.relays.value.filter((url) => !relays.includes(url));
    if (missingRelays.length === 0) {
      return;
    }

    setBroadcasting(true);
    const action = nostrPostAction(missingRelays, event, 5000);

    action.subscribe({
      next: (result) => {
        if (result.status) {
          handleEventFromRelay(relayPool.requestRelay(result.url, false), event);
        }
      },
      complete: () => {
        setBroadcasting(false);
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
          <Flex gap="2">
            <Button size="xs" onClick={queryRelays} isLoading={querying}>
              Search
            </Button>
            <Button size="xs" onClick={broadcast} isLoading={broadcasting}>
              Broadcast
            </Button>
          </Flex>
          {relays.map((url) => (
            <Text key={url}>{url}</Text>
          ))}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
