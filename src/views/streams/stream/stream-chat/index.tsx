import { useCallback, useMemo, useRef } from "react";
import { Card, CardBody, CardHeader, CardProps, Flex, Heading } from "@chakra-ui/react";
import { css } from "@emotion/react";
import { Kind } from "nostr-tools";

import { ParsedStream, STREAM_CHAT_MESSAGE_KIND, getATag } from "../../../../helpers/nostr/stream";
import ChatMessage from "./chat-message";
import ZapMessage from "./zap-message";
import { LightboxProvider } from "../../../../components/lightbox-provider";
import IntersectionObserverProvider from "../../../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../../../hooks/use-timeline-cursor-intersection-callback";
import useSubject from "../../../../hooks/use-subject";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { truncatedId } from "../../../../helpers/nostr/events";
import TopZappers from "./top-zappers";
import { parseZapEvent } from "../../../../helpers/zaps";
import { useRelaySelectionRelays } from "../../../../providers/relay-selection-provider";
import useUserMuteList from "../../../../hooks/use-user-mute-list";
import { NostrEvent, isPTag } from "../../../../types/nostr-event";
import { useCurrentAccount } from "../../../../hooks/use-current-account";
import ChatMessageForm from "./chat-message-form";
import UserDirectoryProvider from "../../../../providers/user-directory-provider";

const hideScrollbar = css`
  scrollbar-width: 0;

  ::-webkit-scrollbar {
    width: 0;
  }
`;

export type ChatDisplayMode = "log" | "popup";

export default function StreamChat({
  stream,
  actions,
  displayMode,
  ...props
}: CardProps & { stream: ParsedStream; actions?: React.ReactNode; displayMode?: ChatDisplayMode }) {
  const account = useCurrentAccount();
  const streamRelays = useRelaySelectionRelays();

  const hostMuteList = useUserMuteList(stream.host);
  const muteList = useUserMuteList(account?.pubkey);
  const mutedPubkeys = useMemo(
    () => [...(hostMuteList?.tags ?? []), ...(muteList?.tags ?? [])].filter(isPTag).map((t) => t[1] as string),
    [hostMuteList, muteList],
  );
  const eventFilter = useCallback((event: NostrEvent) => !mutedPubkeys.includes(event.pubkey), [mutedPubkeys]);

  const timeline = useTimelineLoader(
    `${truncatedId(stream.identifier)}-chat`,
    streamRelays,
    {
      "#a": [getATag(stream)],
      kinds: [STREAM_CHAT_MESSAGE_KIND, Kind.Zap],
    },
    { eventFilter },
  );

  const events = useSubject(timeline.timeline).sort((a, b) => b.created_at - a.created_at);
  const pubkeysInChat = useMemo(() => {
    const set = new Set<string>();
    for (const event of events) {
      set.add(event.pubkey);
    }
    return Array.from(set);
  }, [events]);

  const zaps = useMemo(() => {
    const parsed = [];
    for (const event of events) {
      try {
        parsed.push(parseZapEvent(event));
      } catch (e) {}
    }
    return parsed;
  }, [events]);

  const scrollBox = useRef<HTMLDivElement | null>(null);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  const isPopup = !!displayMode;
  const isChatLog = displayMode === "log";

  return (
    <IntersectionObserverProvider callback={callback} root={scrollBox}>
      <UserDirectoryProvider getDirectory={() => pubkeysInChat}>
        <LightboxProvider>
          <Card {...props} overflow="hidden" background={isChatLog ? "transparent" : undefined}>
            {!isPopup && (
              <CardHeader py="3" display="flex" justifyContent="space-between" alignItems="center">
                <Heading size="md">Stream Chat</Heading>
                {actions}
              </CardHeader>
            )}
            <CardBody display="flex" flexDirection="column" overflow="hidden" p={0}>
              <TopZappers zaps={zaps} pt={!isPopup ? 0 : undefined} />
              <Flex
                overflowY="scroll"
                overflowX="hidden"
                ref={scrollBox}
                direction="column-reverse"
                flex={1}
                px="4"
                py="2"
                mb="2"
                gap="2"
                css={isChatLog && hideScrollbar}
              >
                {events.map((event) =>
                  event.kind === STREAM_CHAT_MESSAGE_KIND ? (
                    <ChatMessage key={event.id} event={event} stream={stream} />
                  ) : (
                    <ZapMessage key={event.id} zap={event} stream={stream} />
                  ),
                )}
              </Flex>
              {!isChatLog && <ChatMessageForm stream={stream} />}
            </CardBody>
          </Card>
        </LightboxProvider>
      </UserDirectoryProvider>
    </IntersectionObserverProvider>
  );
}
