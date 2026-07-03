import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  IconButton,
  Spinner,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CloseIcon, RepeatIcon } from "@chakra-ui/icons";
import { NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useRef, useState } from "react";
import { openNappletArtifactCache, resolveNapplet, type ResolvedNapplet } from "@kehto/nip";

import {
  getNappletDescription,
  getNappletRequiredCapabilities,
  getNappletTitle,
  getUnsupportedNappletRequirements,
} from "../../helpers/nostr/napplets";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";

export type NappletFrameProps = Omit<CardProps, "children"> & {
  event: NostrEvent;
  autoLaunch?: boolean;
  height?: string | number;
  onClose?: () => void;
  onResolved?: (napplet: ResolvedNapplet) => void;
  onError?: (error: Error) => void;
};

async function fetchNappletBlob(sha256Hex: string, servers: readonly string[]) {
  for (const server of servers) {
    const url = `${server.replace(/\/$/, "")}/${sha256Hex}`;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return new Uint8Array(await response.arrayBuffer());
    } catch {
      // Try the next server hint.
    }
  }

  throw new Error(`Failed to fetch napplet blob ${sha256Hex}`);
}

export default function NappletFrame({
  event,
  autoLaunch = false,
  height = 600,
  onClose,
  onResolved,
  onError,
  ...props
}: NappletFrameProps) {
  const { requestConsent, registerFrame, unregisterFrame } = useNappletShell();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const windowIdRef = useRef<string>();
  const [launched, setLaunched] = useState(autoLaunch);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [napplet, setNapplet] = useState<ResolvedNapplet>();

  const title = getNappletTitle(event);
  const description = getNappletDescription(event);

  useEffect(() => {
    if (!launched) return;

    let mounted = true;
    const capabilities = getNappletRequiredCapabilities(event);
    const unsupported = getUnsupportedNappletRequirements(event);

    async function load() {
      setLoading(true);
      setError(undefined);
      setNapplet(undefined);

      try {
        if (unsupported.length > 0) throw new Error(`Unsupported napplet requirements: ${unsupported.join(", ")}`);

        const cache = await openNappletArtifactCache();
        const resolved = await resolveNapplet({ event, cache, fetchBlob: fetchNappletBlob });
        const identity = { pubkey: event.pubkey, dTag: resolved.dTag, aggregateHash: resolved.aggregateHash };
        const allowed = await requestConsent(event, identity, capabilities);
        if (!allowed) throw new Error("Napplet access denied");
        if (!mounted) return;

        setNapplet(resolved);
        onResolved?.(resolved);
      } catch (e) {
        const next = e instanceof Error ? e : new Error(String(e));
        if (!mounted) return;
        setError(next);
        onError?.(next);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [event, launched, reloadKey, requestConsent, onResolved, onError]);

  useEffect(() => {
    return () => {
      if (windowIdRef.current) unregisterFrame(windowIdRef.current);
    };
  }, [unregisterFrame]);

  const setIframe = useCallback(
    (node: HTMLIFrameElement | null) => {
      iframeRef.current = node;
      if (!node || !napplet || !node.contentWindow) return;

      // Register before assigning srcdoc so early shell.ready messages can route.
      if (windowIdRef.current) unregisterFrame(windowIdRef.current);

      const windowId = `napplet:${event.id}:${reloadKey}`;
      windowIdRef.current = windowId;
      registerFrame(windowId, node.contentWindow, {
        dTag: napplet.dTag,
        aggregateHash: napplet.aggregateHash,
      });

      node.srcdoc = napplet.indexHtml;
    },
    [event.id, napplet, registerFrame, reloadKey, unregisterFrame],
  );

  const clearIframe = useCallback(() => {
    if (windowIdRef.current) unregisterFrame(windowIdRef.current);
    windowIdRef.current = undefined;
  }, [unregisterFrame]);

  const reload = useCallback(() => {
    clearIframe();
    setReloadKey((key) => key + 1);
  }, [clearIframe]);

  const close = useCallback(() => {
    clearIframe();
    setLaunched(false);
    setNapplet(undefined);
    setError(undefined);
    onClose?.();
  }, [clearIframe, onClose]);

  return (
    <Card variant="outline" overflow="hidden" {...props}>
      <CardHeader p="2" display="flex" alignItems="center" gap="2">
        <Box flex="1" minW="0">
          <Text fontWeight="semibold" noOfLines={1}>
            {title}
          </Text>
          {description && (
            <Text fontSize="sm" color="GrayText" noOfLines={1}>
              {description}
            </Text>
          )}
        </Box>
        <ButtonGroup size="sm" variant="ghost">
          {launched && (
            <Tooltip label="Reload" openDelay={500}>
              <IconButton icon={<RepeatIcon />} aria-label="Reload napplet" onClick={reload} />
            </Tooltip>
          )}
          {launched && (
            <Tooltip label="Close" openDelay={500}>
              <IconButton icon={<CloseIcon />} aria-label="Close napplet" onClick={close} />
            </Tooltip>
          )}
        </ButtonGroup>
      </CardHeader>
      <CardBody p="0">
        {!launched && (
          <Box display="flex" justifyContent="center" p="8">
            <Button colorScheme="primary" onClick={() => setLaunched(true)}>
              Launch Napplet
            </Button>
          </Box>
        )}
        {launched && loading && (
          <Box display="flex" alignItems="center" justifyContent="center" h={height}>
            <Spinner />
          </Box>
        )}
        {launched && error && (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {launched && napplet && !loading && !error && (
          <Box
            as="iframe"
            key={reloadKey}
            ref={setIframe}
            sandbox="allow-scripts"
            w="full"
            h={height}
            border="none"
            display="block"
          />
        )}
      </CardBody>
    </Card>
  );
}
