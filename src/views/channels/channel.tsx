import { Button, ButtonGroup, Flex, Spinner, useDisclosure } from "@chakra-ui/react";
import { ChannelHiddenModel, ChannelMessagesModel, ChannelMutedModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { memo, useCallback, useMemo } from "react";

import { ErrorBoundary } from "../../components/error-boundary";
import SimpleView from "../../components/layout/presets/simple-view";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { groupMessages } from "../../helpers/nostr/dms";
import { truncateId } from "../../helpers/string";
import useChannelMetadata from "../../hooks/use-channel-metadata";
import { useReadRelays } from "../../hooks/use-client-relays";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import ThreadsProvider from "../../providers/local/thread-provider";
import ChannelImage from "./components/channel-image";
import ChannelJoinButton from "./components/channel-join-button";
import ChannelMenu from "./components/channel-menu";
import ChannelMessageBlock from "./components/channel-message-block";
import ChannelMetadataDrawer from "./components/channel-metadata-drawer";
import ChannelMessageForm from "./components/channel-message-form";

const ChannelChatLog = memo(({ channel }: { channel: NostrEvent }) => {
  const messages = useEventModel(ChannelMessagesModel, [channel]) ?? [];
  const mutes = useEventModel(ChannelMutedModel, [channel]);
  const hidden = useEventModel(ChannelHiddenModel, [channel]);

  const filteredMessages = useMemo(
    () =>
      messages.filter((e) => {
        if (mutes?.has(e.pubkey)) return false;
        if (hidden?.has(e.id)) return false;

        return !e.tags.some((t) => t[0] === "e" && t[1] !== channel.id && t[3] === "root");
      }),
    [messages.length, channel.id, hidden?.size, mutes?.size],
  );
  const grouped = useMemo(() => groupMessages(filteredMessages), [filteredMessages]);

  return (
    <>
      {grouped.map((group) => (
        <ChannelMessageBlock key={group[0].id} messages={group} reverse />
      ))}
    </>
  );
});

function ChannelPage({ channel }: { channel: NostrEvent }) {
  const relays = useReadRelays();
  const drawer = useDisclosure();

  const metadata = useChannelMetadata(channel, relays);

  const clientMuteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (e: NostrEvent) => {
      if (clientMuteFilter(e)) return false;
      return true;
    },
    [clientMuteFilter],
  );
  const { loader, timeline } = useTimelineLoader(
    `${truncateId(channel.id)}-chat-messages`,
    relays,
    {
      kinds: [kinds.ChannelMessage],
      "#e": [channel.id],
    },
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ThreadsProvider messages={timeline}>
      <IntersectionObserverProvider callback={callback}>
        <SimpleView
          scroll={false}
          flush
          title={
            <Flex gap="2" alignItems="center">
              <ChannelImage channel={channel} w="10" rounded="md" />
              {metadata?.name}
            </Flex>
          }
          actions={
            <ButtonGroup size="sm" ms="auto">
              <ChannelJoinButton channel={channel} hideBelow="lg" />
              <Button onClick={drawer.onOpen}>Channel Info</Button>
              <ChannelMenu channel={channel} aria-label="More Options" />
            </ButtonGroup>
          }
        >
          <Flex direction="column-reverse" p="4" gap={2} flexGrow={1} h={0} overflowX="hidden" overflowY="auto">
            <ChannelChatLog channel={channel} />
            <TimelineActionAndStatus loader={loader} />
          </Flex>

          <ChannelMessageForm channel={channel} px="2" pb="2" />
        </SimpleView>
        {drawer.isOpen && <ChannelMetadataDrawer isOpen onClose={drawer.onClose} channel={channel} size="lg" />}
      </IntersectionObserverProvider>
    </ThreadsProvider>
  );
}

export default function ChannelView() {
  const pointer = useParamsEventPointer("id");
  const channel = useSingleEvent(pointer);

  if (!channel) return <Spinner />;

  return (
    <ErrorBoundary>
      <ChannelPage channel={channel} />
    </ErrorBoundary>
  );
}
