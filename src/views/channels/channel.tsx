import { memo, useCallback, useMemo } from "react";
import { Button, ButtonGroup, Flex, Spinner, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { ChannelHiddenQuery, ChannelMessagesQuery, ChannelMutedQuery } from "applesauce-core/queries";

import useSingleEvent from "../../hooks/use-single-event";
import { ErrorBoundary } from "../../components/error-boundary";
import { NostrEvent } from "../../types/nostr-event";
import useChannelMetadata from "../../hooks/use-channel-metadata";
import ChannelMetadataDrawer from "./components/channel-metadata-drawer";
import ChannelJoinButton from "./components/channel-join-button";
import ChannelMenu from "./components/channel-menu";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import ThreadsProvider from "../../providers/local/thread-provider";
import { groupMessages } from "../../helpers/nostr/dms";
import ChannelMessageBlock from "./components/channel-message-block";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import ChannelMessageForm from "./components/send-message-form";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import { useReadRelays } from "../../hooks/use-client-relays";
import { truncateId } from "../../helpers/string";
import ContainedSimpleView from "../../components/layout/presets/contained-simple-view";
import ChannelImage from "./components/channel-image";

const ChannelChatLog = memo(({ channel }: { channel: NostrEvent }) => {
  const messages = useStoreQuery(ChannelMessagesQuery, [channel]) ?? [];
  const mutes = useStoreQuery(ChannelMutedQuery, [channel]);
  const hidden = useStoreQuery(ChannelHiddenQuery, [channel]);

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
        <ChannelMessageBlock key={group.id} messages={group.events} reverse />
      ))}
    </>
  );
});

function ChannelPage({ channel }: { channel: NostrEvent }) {
  const relays = useReadRelays();
  const drawer = useDisclosure();

  const metadata = useChannelMetadata(channel.id, relays);

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
        <ContainedSimpleView
          reverse
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
          bottom={<ChannelMessageForm channel={channel} p="2" />}
        >
          <ChannelChatLog channel={channel} />
          <TimelineActionAndStatus loader={loader} />
        </ContainedSimpleView>
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
      <ChannelPage channel={channel} />
    </ErrorBoundary>
  );
}
