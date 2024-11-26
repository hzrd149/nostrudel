import { useContext, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  Spacer,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Global, css } from "@emotion/react";

import { ParsedStream, parseStreamEvent } from "../../../helpers/nostr/stream";
import LiveVideoPlayer from "../../../components/live-video-player";
import StreamChat, { ChatDisplayMode } from "./stream-chat";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import StreamSummaryContent from "../components/stream-summary-content";
import { ChevronLeftIcon, ExternalLinkIcon } from "../../../components/icons";
import useSetColorMode from "../../../hooks/use-set-color-mode";
import { CopyIconButton } from "../../../components/copy-icon-button";
import StreamerCards from "../components/streamer-cards";
import { useAppTitle } from "../../../hooks/use-app-title";
import StreamSatsPerMinute from "../components/stream-sats-per-minute";
import { UserEmojiProvider } from "../../../providers/global/emoji-provider";
import StreamStatusBadge from "../components/status-badge";
import ChatMessageForm from "./stream-chat/stream-chat-form";
import StreamChatLog from "./stream-chat/chat-log";
import StreamTopZappers from "../components/stream-top-zappers";
import StreamHashtags from "../components/stream-hashtags";
import StreamZapButton from "../components/stream-zap-button";
import StreamGoal from "../components/stream-goal";
import StreamShareButton from "../components/stream-share-button";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { AdditionalRelayProvider } from "../../../providers/local/additional-relay-context";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import useParamsAddressPointer from "../../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import QuoteEventButton from "../../../components/note/quote-event-button";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { AppHandlerContext } from "../../../providers/route/app-handler-provider";
import { getSharableEventAddress } from "../../../services/event-relay-hint";
import StreamOpenButton from "../components/stream-open-button";

function DesktopStreamPage({ stream }: { stream: ParsedStream }) {
  useAppTitle(stream.title);
  const navigate = useNavigate();

  const [showChat, setShowChat] = useState(true);

  const renderChatActions = () => {
    return (
      <ButtonGroup>
        <CopyIconButton
          value={location.href + "?displayMode=log&colorMode=dark"}
          aria-label="Copy chat log URL"
          title="Copy chat log URL"
          size="sm"
        />
        <Button
          rightIcon={<ExternalLinkIcon />}
          size="sm"
          onClick={() => {
            const w = 512;
            const h = 910;
            const y = window.screenTop + window.innerHeight - h;
            const x = window.screenLeft + window.innerWidth - w;
            window.open(location.href + "?displayMode=popup", "_blank", `width=${w},height=${h},left=${x},top=${y}`);
          }}
        >
          Pop out
        </Button>
      </ButtonGroup>
    );
  };

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center">
        <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon boxSize={6} />}>
          Back
        </Button>
        <UserAvatarLink pubkey={stream.host} size="sm" display={{ base: "none", md: "block" }} />
        <Heading size="md" isTruncated display={{ base: "none", md: "initial" }}>
          {stream.title}
        </Heading>
        <StreamStatusBadge stream={stream} fontSize="lg" />

        <ButtonGroup ml="auto">
          <StreamOpenButton stream={stream.event} />
          <QuoteEventButton event={stream.event} title="Share stream" />
          <DebugEventButton event={stream.event} />
          <Button onClick={() => setShowChat((v) => !v)}>{showChat ? "Hide" : "Show"} Chat</Button>
        </ButtonGroup>
      </Flex>
      <Flex gap="2" maxH="calc(100vh - 4rem)" overflow="hidden">
        <LiveVideoPlayer
          stream={stream.streaming || stream.recording}
          autoPlay={!!stream.streaming}
          poster={stream.image}
          // NOTE: width=0 is used for chromium browser to stop the video element from pushing the chat off screen
          w={0}
          flexGrow={1}
          mx="auto"
        />
        {showChat && (
          <Flex direction="column" gap="2" flexGrow={1} maxW="lg" flexShrink={0}>
            <StreamGoal stream={stream} />
            <StreamChat stream={stream} actions={renderChatActions()} flex={1} />
          </Flex>
        )}
      </Flex>
      <TrustProvider trust>
        <Flex gap="2" alignItems="center">
          <UserAvatarLink pubkey={stream.host} noProxy />
          <Box>
            <Heading size="md">{stream.title}</Heading>
            <UserLink pubkey={stream.host} />
          </Box>
          <Spacer />
          {!!window.webln && <StreamSatsPerMinute pubkey={stream.host} />}
        </Flex>
        <StreamSummaryContent stream={stream} />
        {stream.tags.length > 0 && (
          <Flex gap="2" wrap="wrap">
            <StreamHashtags stream={stream} />
          </Flex>
        )}

        <Flex gap="2" wrap="wrap">
          <StreamerCards pubkey={stream.host} maxW="lg" minW="md" />
        </Flex>
      </TrustProvider>
    </VerticalPageLayout>
  );
}

function MobileStreamPage({ stream }: { stream: ParsedStream }) {
  useAppTitle(stream.title);
  const navigate = useNavigate();
  const showChat = useDisclosure();

  return (
    <VerticalPageLayout px={0}>
      <TrustProvider trust>
        <Flex gap="2" alignItems="center" px="2" flexShrink={0}>
          <Button onClick={() => navigate(-1)} leftIcon={<ChevronLeftIcon />} size="sm">
            Back
          </Button>
          <ButtonGroup size="sm" ml="auto">
            <StreamOpenButton stream={stream.event} />
            <QuoteEventButton event={stream.event} title="Share stream" />
            <DebugEventButton event={stream.event} />
            <Button onClick={showChat.onOpen}>Show Chat</Button>
          </ButtonGroup>
        </Flex>
        <LiveVideoPlayer
          stream={stream.streaming || stream.recording}
          autoPlay={!!stream.streaming}
          poster={stream.image}
        />
        <Flex direction="column" gap="2" overflow="hidden" px="2">
          <Flex gap="2">
            <UserAvatarLink pubkey={stream.host} noProxy />
            <Box>
              <Heading size="md">{stream.title}</Heading>
              <UserLink pubkey={stream.host} />
            </Box>
          </Flex>
          <StreamSummaryContent stream={stream} />
          {stream.tags.length > 0 && (
            <Flex gap="2" wrap="wrap">
              <StreamHashtags stream={stream} />
            </Flex>
          )}
          <StreamZapButton stream={stream} label="Zap Stream" />
          <Heading size="sm">Stream goal</Heading>
          <Divider />
          <StreamGoal stream={stream} />
          <StreamerCards pubkey={stream.host} />
        </Flex>
      </TrustProvider>
      <Drawer onClose={showChat.onClose} isOpen={showChat.isOpen} size="full" isFullHeight>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader px="4" pb="0">
            Stream Chat
          </DrawerHeader>
          <DrawerBody p={0} overflow="hidden" display="flex" gap="2" flexDirection="column">
            <StreamTopZappers stream={stream} px="2" />
            <StreamChatLog stream={stream} flex={1} px="2" />
            <ChatMessageForm stream={stream} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </VerticalPageLayout>
  );
}

function StreamPage({ stream }: { stream: ParsedStream }) {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const Layout = isMobile ? MobileStreamPage : DesktopStreamPage;

  return <Layout stream={stream} />;
}

function ChatWidget({ stream, displayMode }: { stream: ParsedStream; displayMode: ChatDisplayMode }) {
  return (
    <>
      <Global
        styles={css`
          body {
            background: transparent;
          }
        `}
      />
      <StreamChat stream={stream} flexGrow={1} h="100vh" w="100vw" displayMode={displayMode} />
    </>
  );
}

export default function StreamView() {
  const [params] = useSearchParams();
  useSetColorMode();

  const pointer = useParamsAddressPointer("naddr", true);
  const [streamRelays, setStreamRelays] = useState<string[]>([]);

  const event = useReplaceableEvent(pointer, streamRelays);
  const stream = useMemo(() => event && parseStreamEvent(event), [event]);

  // refetch the stream from the correct relays when its loaded to ensure we have the latest
  useEffect(() => {
    if (stream?.relays) setStreamRelays(stream.relays);
  }, [stream?.relays]);

  const displayMode = (params.get("displayMode") as ChatDisplayMode) ?? undefined;

  if (!stream) return <Spinner />;
  return (
    // add snort and damus relays so zap.stream will always see zaps
    <AdditionalRelayProvider relays={streamRelays}>
      <UserEmojiProvider pubkey={stream.host}>
        {displayMode ? <ChatWidget stream={stream} displayMode={displayMode} /> : <StreamPage stream={stream} />}
      </UserEmojiProvider>
    </AdditionalRelayProvider>
  );
}
