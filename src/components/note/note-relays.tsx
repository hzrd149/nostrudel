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
import { handleEventFromRelay } from "../../services/event-relays";
import { NostrEvent } from "../../types/nostr-event";
import { RelayIcon } from "../icons";
import { RelayFavicon } from "../relay-favicon";
import { useWriteRelayUrls } from "../../hooks/use-client-relays";
import relayPoolService from "../../services/relay-pool";
import useEventRelays from "../../hooks/use-event-relays";

export type NoteRelaysProps = Omit<IconButtonProps, "icon" | "aria-label"> & {
  event: NostrEvent;
};

export const NoteRelays = memo(({ event, ...props }: NoteRelaysProps) => {
  const eventRelays = useEventRelays();
  const writeRelays = useWriteRelayUrls();

  const [broadcasting, setBroadcasting] = useState(false);
  const broadcast = useCallback(() => {
    const missingRelays = writeRelays.filter((url) => !eventRelays.includes(url));
    if (missingRelays.length === 0) {
      return;
    }

    setBroadcasting(true);
    const { results, onComplete } = nostrPostAction(missingRelays, event, 5000);

    results.subscribe((result) => {
      if (result.status) {
        handleEventFromRelay(relayPoolService.requestRelay(result.url, false), event);
      }
    });

    onComplete.then(() => setBroadcasting(false));
  }, []);

  return (
    <Popover isLazy>
      <PopoverTrigger>
        <IconButton title="Note Relays" icon={<RelayIcon />} aria-label="Note Relays" {...props} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>
          {eventRelays.map((url) => (
            <Flex alignItems="center" key={url}>
              <RelayFavicon relay={url} size="2xs" mr="2" />
              <Text isTruncated>{url}</Text>
            </Flex>
          ))}
        </PopoverBody>
        <PopoverFooter>
          <Flex gap="2">
            <Button size="xs" onClick={broadcast} isLoading={broadcasting} leftIcon={<RelayIcon />}>
              Broadcast
            </Button>
          </Flex>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
});
