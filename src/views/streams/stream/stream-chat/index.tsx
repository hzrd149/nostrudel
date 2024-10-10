import { useRef } from "react";
import { Card, CardBody, CardHeader, CardProps, Heading } from "@chakra-ui/react";

import { ParsedStream } from "../../../../helpers/nostr/stream";
import { LightboxProvider } from "../../../../components/lightbox-provider";
import IntersectionObserverProvider from "../../../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import TopZappers from "../../components/top-zappers";
import ChatMessageForm from "./stream-chat-form";
import useStreamChatTimeline from "./use-stream-chat-timeline";
import StreamChatLog from "./chat-log";

export type ChatDisplayMode = "log" | "popup";

export default function StreamChat({
  stream,
  actions,
  displayMode,
  ...props
}: CardProps & { stream: ParsedStream; actions?: React.ReactNode; displayMode?: ChatDisplayMode }) {
  const { loader } = useStreamChatTimeline(stream);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(loader);

  const isPopup = !!displayMode;
  const isChatLog = displayMode === "log";

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <LightboxProvider>
        <Card {...props} overflow="hidden" background={isChatLog ? "transparent" : undefined}>
          {!isPopup && (
            <CardHeader py="3" display="flex" justifyContent="space-between" alignItems="center">
              <Heading size="md">Stream Chat</Heading>
              {actions}
            </CardHeader>
          )}
          <CardBody display="flex" flexDirection="column" overflow="hidden" p={0}>
            <TopZappers stream={stream} py="2" px="4" pt={!isPopup ? 0 : undefined} />
            <StreamChatLog ref={scrollBox} stream={stream} flex={1} px="4" py="2" mb="2" />
            {!isChatLog && <ChatMessageForm stream={stream} />}
          </CardBody>
        </Card>
      </LightboxProvider>
    </IntersectionObserverProvider>
  );
}
