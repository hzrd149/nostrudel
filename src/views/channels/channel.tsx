import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Flex, Heading, Spinner, useDisclosure } from "@chakra-ui/react";

import { safeDecode } from "../../helpers/nip19";
import useSingleEvent from "../../hooks/use-single-event";
import { ErrorBoundary } from "../../components/error-boundary";
import { NostrEvent } from "../../types/nostr-event";
import useChannelMetadata from "../../hooks/use-channel-metadata";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/relay-selection-provider";
import { ChevronLeftIcon } from "../../components/icons";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import ChannelMetadataDrawer from "./components/channel-metadata-drawer";
import ChannelJoinButton from "./components/channel-join-button";
import ChannelChatLog from "./components/channel-chat-log";
import ChannelMenu from "./components/channel-menu";

function ChannelPage({ channel }: { channel: NostrEvent }) {
  const navigate = useNavigate();
  const { relays } = useRelaySelectionContext();
  const { metadata } = useChannelMetadata(channel.id, relays);
  const drawer = useDisclosure();

  return (
    <Flex h="100vh" overflow="hidden" direction="column" p="2" gap="2">
      <Flex gap="2" alignItems="center">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <RelaySelectionButton />
        <Heading hideBelow="lg" size="lg">
          {metadata?.name}
        </Heading>
        <ChannelJoinButton channel={channel} ml="auto" />
        <Button onClick={drawer.onOpen}>Channel Info</Button>
        <ChannelMenu channel={channel} aria-label="More Options" />
      </Flex>

      <ChannelChatLog channel={channel} flexGrow={1} relays={relays} />

      {drawer.isOpen && <ChannelMetadataDrawer isOpen onClose={drawer.onClose} channel={channel} size="lg" />}
    </Flex>
  );
}

export default function ChannelView() {
  const { id } = useParams() as { id: string };
  const parsed = useMemo(() => {
    const result = safeDecode(id);
    if (!result) return;
    if (result.type === "note") return { id: result.data };
    if (result.type === "nevent") return result.data;
  }, [id]);
  const channel = useSingleEvent(parsed?.id, parsed?.relays ?? []);

  if (!channel) return <Spinner />;

  return (
    <ErrorBoundary>
      <RelaySelectionProvider>
        <ChannelPage channel={channel} />
      </RelaySelectionProvider>
    </ErrorBoundary>
  );
}
