import { useEffect, useRef, useState } from "react";
import { useScroll } from "react-use";
import { Box, Button, Flex, Heading, Spacer, Spinner, Text } from "@chakra-ui/react";
import { Link as RouterLink, useParams, Navigate } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { ParsedStream, parseStreamEvent } from "../../../helpers/nostr/stream";
import { NostrRequest } from "../../../classes/nostr-request";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { unique } from "../../../helpers/array";
import { LiveVideoPlayer } from "../../../components/live-video-player";
import StreamChat from "./stream-chat";
import { UserAvatarLink } from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import { useIsMobile } from "../../../hooks/use-is-mobile";
import { AdditionalRelayProvider } from "../../../providers/additional-relay-context";
import StreamSummaryContent from "../components/stream-summary-content";
import { ArrowDownSIcon, ArrowUpSIcon } from "../../../components/icons";

function StreamPage({ stream }: { stream: ParsedStream }) {
  const isMobile = useIsMobile();
  const scrollBox = useRef<HTMLDivElement | null>(null);
  const scrollState = useScroll(scrollBox);

  const action =
    scrollState.y === 0 ? (
      <Button
        size="sm"
        onClick={() => scrollBox.current?.scroll(0, scrollBox.current.scrollHeight)}
        leftIcon={<ArrowDownSIcon />}
      >
        View Chat
      </Button>
    ) : (
      <Button size="sm" onClick={() => scrollBox.current?.scroll(0, 0)} leftIcon={<ArrowUpSIcon />}>
        View Stream
      </Button>
    );

  return (
    <Flex
      h="full"
      overflowX="hidden"
      overflowY="auto"
      direction={isMobile ? "column" : "row"}
      p={isMobile ? 0 : "2"}
      gap={isMobile ? 0 : "4"}
      ref={scrollBox}
    >
      <Flex gap={isMobile ? "2" : "4"} direction="column" flexGrow={isMobile ? 0 : 1}>
        <LiveVideoPlayer stream={stream.streaming} autoPlay poster={stream.image} maxH="100vh" />
        <Flex gap={isMobile ? "2" : "4"} alignItems="center" p={isMobile ? "2" : 0}>
          <UserAvatarLink pubkey={stream.author} />
          <Box>
            <Heading size="md">
              <UserLink pubkey={stream.author} />
            </Heading>
            <Text>{stream.title}</Text>
          </Box>
          <Spacer />
          <Button as={RouterLink} to="/streams">
            Back
          </Button>
        </Flex>
        <StreamSummaryContent stream={stream} px={isMobile ? "2" : 0} />
      </Flex>
      <StreamChat
        stream={stream}
        flexGrow={1}
        maxW={isMobile ? undefined : "lg"}
        maxH="100vh"
        minH={isMobile ? "100vh" : undefined}
        flexShrink={0}
        actions={isMobile && action}
      />
    </Flex>
  );
}

export default function StreamView() {
  const { naddr } = useParams();
  if (!naddr) return <Navigate replace to="/streams" />;

  const readRelays = useReadRelayUrls();
  const [stream, setStream] = useState<ParsedStream>();
  const [relays, setRelays] = useState<string[]>([]);

  useEffect(() => {
    try {
      const parsed = nip19.decode(naddr);
      if (parsed.type !== "naddr") throw new Error("Invalid stream address");
      if (parsed.data.kind !== 30311) throw new Error("Invalid stream kind");

      const request = new NostrRequest(unique([...readRelays, ...(parsed.data.relays ?? [])]));
      request.onEvent.subscribe((event) => {
        setStream(parseStreamEvent(event));
        if (parsed.data.relays) setRelays(parsed.data.relays);
      });
      request.start({ kinds: [parsed.data.kind], "#d": [parsed.data.identifier], authors: [parsed.data.pubkey] });
    } catch (e) {
      console.log(e);
    }
  }, [naddr]);

  if (!stream) return <Spinner />;
  return (
    <AdditionalRelayProvider relays={relays}>
      <StreamPage stream={stream} />
    </AdditionalRelayProvider>
  );
}
