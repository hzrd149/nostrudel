import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Flex, Heading, Spacer, Spinner, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import useSingleEvent from "../../hooks/use-single-event";
import { ErrorBoundary } from "../../components/error-boundary";
import { NostrEvent } from "../../types/nostr-event";
import useChannelMetadata from "../../hooks/use-channel-metadata";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/local/relay-selection-provider";
import { ChevronLeftIcon } from "../../components/icons";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import ChannelMetadataDrawer from "./components/channel-metadata-drawer";
import ChannelJoinButton from "./components/channel-join-button";
import ChannelMenu from "./components/channel-menu";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import ThreadsProvider from "../../providers/local/thread-provider";
import TimelineLoader from "../../classes/timeline-loader";
import useSubject from "../../hooks/use-subject";
import { groupMessages } from "../../helpers/nostr/dms";
import ChannelMessageBlock from "./components/channel-message-block";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import ChannelMessageForm from "./components/send-message-form";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";

const ChannelChatLog = memo(({ timeline, channel }: { timeline: TimelineLoader; channel: NostrEvent }) => {
  const messages = useSubject(timeline.timeline);
  const filteredMessages = useMemo(
    () => messages.filter((e) => !e.tags.some((t) => t[0] === "e" && t[1] !== channel.id && t[3] === "root")),
    [messages.length, channel.id],
  );
  const grouped = useMemo(() => groupMessages(filteredMessages), [filteredMessages]);

  return (
    <>
      {grouped.map((group) => (
        <ChannelMessageBlock key={group.id} messages={group.events} reverse />
      ))}
    </>
  );
});

function ChannelPage({ channel }: { channel: NostrEvent }) {
  const navigate = useNavigate();
  const { relays } = useRelaySelectionContext();
  const { metadata } = useChannelMetadata(channel.id, relays);
  const drawer = useDisclosure();

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
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <ThreadsProvider timeline={timeline}>
      <IntersectionObserverProvider callback={callback}>
        <Flex h="full" overflow="hidden" direction="column" p="2" gap="2" flexGrow={1}>
          <Flex gap="2" alignItems="center">
            <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <RelaySelectionButton hideBelow="lg" />
            <Heading hideBelow="lg" size="lg">
              {metadata?.name}
            </Heading>
            <Spacer />
            <ChannelJoinButton channel={channel} hideBelow="lg" />
            <Button onClick={drawer.onOpen}>Channel Info</Button>
            <ChannelMenu channel={channel} aria-label="More Options" />
          </Flex>

          <Flex
            h="0"
            flexGrow={1}
            overflowX="hidden"
            overflowY="scroll"
            direction="column-reverse"
            gap="2"
            py="4"
            px="2"
          >
            <ChannelChatLog timeline={timeline} channel={channel} />
            <TimelineActionAndStatus timeline={timeline} />
          </Flex>

          <ChannelMessageForm channel={channel} />
        </Flex>
        {drawer.isOpen && <ChannelMetadataDrawer isOpen onClose={drawer.onClose} channel={channel} size="lg" />}
      </IntersectionObserverProvider>
    </ThreadsProvider>
  );
}

export default function ChannelView() {
  const pointer = useParamsEventPointer("id");
  const channel = useSingleEvent(pointer?.id, pointer?.relays);

  if (!channel) return <Spinner />;

  return (
    <ErrorBoundary>
      <RelaySelectionProvider>
        <ChannelPage channel={channel} />
      </RelaySelectionProvider>
    </ErrorBoundary>
  );
}
