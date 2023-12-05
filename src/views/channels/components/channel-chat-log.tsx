import { useCallback } from "react";
import { Flex, FlexProps } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { NostrEvent } from "../../../types/nostr-event";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/intersection-observer";
import useSubject from "../../../hooks/use-subject";
import ChannelChatMessage from "./channel-chat-message";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import { LightboxProvider } from "../../../components/lightbox-provider";

export default function ChannelChatLog({
  channel,
  relays,
  ...props
}: Omit<FlexProps, "children"> & { channel: NostrEvent; relays: string[] }) {
  const clientMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (clientMuteFilter(e)) return false;
      return true;
    },
    [clientMuteFilter],
  );
  const timeline = useTimelineLoader(
    `${channel.id}-chat-messages`,
    relays,
    {
      kinds: [Kind.ChannelMessage],
      "#e": [channel.id],
    },
    { eventFilter },
  );

  const messages = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <LightboxProvider>
        <Flex direction="column-reverse" overflowX="hidden" overflowY="auto" gap="2" h="0" {...props}>
          {messages.map((message) => (
            <ChannelChatMessage key={message.id} channel={channel} message={message} />
          ))}
        </Flex>
      </LightboxProvider>
    </IntersectionObserverProvider>
  );
}
