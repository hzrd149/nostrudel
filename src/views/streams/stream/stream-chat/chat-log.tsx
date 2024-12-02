import { forwardRef } from "react";
import { kinds, NostrEvent } from "nostr-tools";
import { Flex, FlexProps } from "@chakra-ui/react";
import { css } from "@emotion/react";

import useStreamChatTimeline from "./use-stream-chat-timeline";
import ChatMessage from "./chat-message";
import ZapMessage from "./zap-message";

const hideScrollbarCss = css`
  scrollbar-width: 0;

  ::-webkit-scrollbar {
    width: 0;
  }
`;

const StreamChatLog = forwardRef<
  HTMLDivElement,
  Omit<FlexProps, "children"> & { stream: NostrEvent; hideScrollbar?: boolean }
>(({ stream, hideScrollbar, ...props }, ref) => {
  const { timeline: events } = useStreamChatTimeline(stream);

  return (
    <Flex
      ref={ref}
      overflowY="scroll"
      overflowX="hidden"
      direction="column-reverse"
      gap="2"
      css={hideScrollbar && hideScrollbarCss}
      {...props}
    >
      {events.map((event) =>
        event.kind === kinds.LiveChatMessage ? (
          <ChatMessage key={event.id} event={event} stream={stream} />
        ) : (
          <ZapMessage key={event.id} zap={event} />
        ),
      )}
    </Flex>
  );
});

export default StreamChatLog;
