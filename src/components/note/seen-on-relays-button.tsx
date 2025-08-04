import {
  Flex,
  IconButton,
  IconButtonProps,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
} from "@chakra-ui/react";
import { getSeenRelays } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { RelayIcon } from "../icons";
import RelayFavicon from "../relay/relay-favicon";

export default function SeenOnRelaysButton({
  event,
  ...props
}: Omit<IconButtonProps, "children" | "onClick" | "aria-label"> & { event: NostrEvent }) {
  const relays = getSeenRelays(event);

  return (
    <>
      <Popover isLazy>
        <PopoverTrigger>
          <IconButton icon={<RelayIcon />} aria-label="Seen on relays" {...props} />
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>Seen on relays</PopoverHeader>
          <PopoverBody display="flex" flexDirection="column" gap="1">
            {relays &&
              Array.from(relays).map((relay) => (
                <Flex key={relay} alignItems="center" gap="2">
                  <RelayFavicon relay={relay} size="xs" />
                  <Text>{new URL(relay).hostname}</Text>
                </Flex>
              ))}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
}
