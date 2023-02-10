import { memo, useCallback, useState } from "react";
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
  PopoverFooter,
} from "@chakra-ui/react";
import { nostrPostAction } from "../../classes/nostr-post-action";
import { NostrRequest } from "../../classes/nostr-request";
import useSubject from "../../hooks/use-subject";
import { getEventRelays, handleEventFromRelay } from "../../services/event-relays";
import { NostrEvent } from "../../types/nostr-event";
import { RelayIcon, SearchIcon } from "../icons";
import { RelayFavicon } from "../relay-favicon";
import { useReadRelayUrls, useWriteRelayUrls } from "../../hooks/use-client-relays";
import relayPoolService from "../../services/relay-pool";

export type NoteRelaysProps = Omit<IconButtonProps, "icon" | "aria-label"> & {
  event: NostrEvent;
};

export const NoteRelays = memo(({ event, ...props }: NoteRelaysProps) => {
  const eventRelays = useSubject(getEventRelays(event.id));
  const readRelays = useReadRelayUrls();
  const writeRelays = useWriteRelayUrls();

  const [querying, setQuerying] = useState(false);
  const queryRelays = useCallback(() => {
    setQuerying(true);
    const request = new NostrRequest(readRelays);
    request.start({ ids: [event.id] });
    request.onEvent.subscribe({
      complete() {
        setQuerying(false);
      },
    });
  }, []);

  const [broadcasting, setBroadcasting] = useState(false);
  const broadcast = useCallback(() => {
    const missingRelays = writeRelays.filter((url) => !eventRelays.includes(url));
    if (missingRelays.length === 0) {
      return;
    }

    setBroadcasting(true);
    const action = nostrPostAction(missingRelays, event, 5000);

    action.subscribe({
      next: (result) => {
        if (result.status) {
          handleEventFromRelay(relayPoolService.requestRelay(result.url, false), event);
        }
      },
      complete: () => {
        setBroadcasting(false);
      },
    });
  }, []);

  return (
    <Popover isLazy>
      <PopoverTrigger>
        <IconButton title="Note Relays" icon={<RelayIcon />} size={props.size ?? "sm"} aria-label="Note Relays" />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          {eventRelays.map((url) => (
            <Flex alignItems="center" key={url}>
              <RelayFavicon relay={url} size="2xs" mr="2" />
              <Text>{url}</Text>
            </Flex>
          ))}
        </PopoverBody>
        <PopoverFooter>
          <Flex gap="2">
            <Button size="xs" onClick={queryRelays} isLoading={querying} leftIcon={<SearchIcon />}>
              Search
            </Button>
            <Button size="xs" onClick={broadcast} isLoading={broadcasting} leftIcon={<RelayIcon />}>
              Broadcast
            </Button>
          </Flex>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
});
