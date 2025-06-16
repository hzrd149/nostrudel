import { NostrEvent } from "nostr-tools";
import { Box, BoxProps } from "@chakra-ui/react";

import { useReadRelays } from "../../../hooks/use-client-relays";
import useChannelMetadata from "../../../hooks/use-channel-metadata";

export default function ChannelImage({ channel, ...props }: { channel: NostrEvent } & Omit<BoxProps, "children">) {
  const readRelays = useReadRelays();
  const metadata = useChannelMetadata(channel, readRelays);

  return (
    <Box
      backgroundImage={metadata?.picture}
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      aspectRatio={1}
      {...props}
    />
  );
}
