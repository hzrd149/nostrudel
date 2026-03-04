import { forwardRef, useCallback, useRef, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Flex,
  IconButton,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CloseIcon, RepeatIcon } from "@chakra-ui/icons";
import { NostrEvent } from "nostr-tools";

import { Webxdc, type WebxdcHandle } from "../../../components/webxdc/webxdc";
import { GameControls } from "../../../components/webxdc/game-controls";
import useWebxdc from "../../../hooks/use-webxdc";
import { getWebxdcId, getWebxdcUrl } from "../../../helpers/nostr/webxdc";
import { ChevronDownIcon, ChevronUpIcon } from "../../../components/icons";

// ---------------------------------------------------------------------------
// Inner component — separated so useWebxdc only runs when app is launched
// ---------------------------------------------------------------------------

const WebxdcIframe = forwardRef<WebxdcHandle, { id: string; url: string; uuid: string; height: string | number }>(
  function WebxdcIframe({ id, url, uuid, height }, ref) {
    const webxdc = useWebxdc(uuid);

    return (
      <Webxdc
        ref={ref}
        id={id}
        xdc={url}
        webxdc={webxdc}
        allow="autoplay; fullscreen; gamepad"
        style={{ width: "100%", height, border: "none", display: "block" }}
      />
    );
  },
);

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export default function WebxdcPlayer({
  event,
  width,
  height = "500px",
}: {
  event: NostrEvent;
  width?: string | number;
  height?: string | number;
}) {
  const [launched, setLaunched] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showGamepad, setShowGamepad] = useState(false);
  const webxdcHandleRef = useRef<WebxdcHandle>(null);

  const appUrl = getWebxdcUrl(event);
  const webxdcId = getWebxdcId(event);

  // Derive a stable iframe id from the webxdc uuid or the event id
  const iframeId = (webxdcId ?? event.id ?? appUrl ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);

  const handleReload = useCallback(() => setIframeKey((k) => k + 1), []);

  const handleClose = useCallback(() => {
    setLaunched(false);
    setIsFullscreen(false);
    setShowGamepad(false);
  }, []);

  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

  const toggleGamepad = useCallback(() => {
    setShowGamepad((v) => {
      if (!v) webxdcHandleRef.current?.focus();
      return !v;
    });
  }, []);

  if (!appUrl) {
    return (
      <Box p="4">
        <Text color="red.500">No .xdc URL found in event</Text>
      </Box>
    );
  }

  if (!launched) {
    return (
      <Flex direction="column" alignItems="center" justifyContent="center" gap="4" py="8" px="6" w={width ?? "100%"}>
        <Button colorScheme="primary" onClick={() => setLaunched(true)}>
          Launch App
        </Button>
      </Flex>
    );
  }

  const card = (
    <Card w={width ?? "100%"} variant="outline" overflow="hidden">
      <CardHeader p="2" display="flex" alignItems="center" gap="2">
        <Text fontSize="sm" fontWeight="medium" flex="1" noOfLines={1}>
          webxdc app
        </Text>
        <ButtonGroup size="sm" variant="ghost" spacing="1">
          <Tooltip label={showGamepad ? "Hide gamepad" : "Show gamepad"} openDelay={500}>
            <IconButton
              icon={<Text fontSize="xs">🎮</Text>}
              aria-label={showGamepad ? "Hide gamepad" : "Show gamepad"}
              onClick={toggleGamepad}
              colorScheme={showGamepad ? "primary" : undefined}
            />
          </Tooltip>
          <Tooltip label="Reload" openDelay={500}>
            <IconButton icon={<RepeatIcon />} aria-label="Reload" onClick={handleReload} />
          </Tooltip>
          <Tooltip label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} openDelay={500}>
            <IconButton
              icon={isFullscreen ? <ChevronDownIcon /> : <ChevronUpIcon />}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={toggleFullscreen}
            />
          </Tooltip>
          <Tooltip label="Close" openDelay={500}>
            <IconButton icon={<CloseIcon />} aria-label="Close" onClick={handleClose} />
          </Tooltip>
        </ButtonGroup>
      </CardHeader>

      <CardBody p="0">
        <WebxdcIframe
          key={iframeKey}
          ref={webxdcHandleRef}
          id={iframeId}
          url={appUrl}
          uuid={webxdcId ?? ""}
          height={isFullscreen ? "calc(100vh - 120px)" : height}
        />
      </CardBody>

      {showGamepad && (
        <>
          <Divider />
          <CardFooter p="0">
            <GameControls webxdcHandle={webxdcHandleRef.current} />
          </CardFooter>
        </>
      )}
    </Card>
  );

  if (isFullscreen) {
    return (
      <Box position="fixed" inset="0" zIndex={9999} display="flex" alignItems="stretch">
        {card}
      </Box>
    );
  }

  return card;
}
