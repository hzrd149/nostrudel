import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  ButtonGroup,
  Flex,
  IconButton,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import { CloseIcon, InfoIcon, RepeatIcon } from "@chakra-ui/icons";
import { NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { openNappletArtifactCache, resolveNapplet, type ResolvedNapplet } from "@kehto/nip";
import { injectNappletNamespacePrelude } from "@kehto/shell";

import SimpleView from "../layout/presets/simple-view";
import {
  getNappletRequiredCapabilities,
  getNappletNaddr,
  getNappletTitle,
  getUnsupportedNappletRequirements,
  type NappletIntent,
} from "../../helpers/nostr/napplets";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";
import { createNappletIntentDelivery, type NappletIntentDelivery } from "../../services/napplet-intent-delivery";

export type NappletFrameProps = {
  event: NostrEvent;
  intent?: NappletIntent;
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

/** Renders a NIP-5D napplet full-page: a simple title/action header and the sandboxed frame below. */
export default function NappletFrame({ event, intent, onClose, onResolved, onError }: NappletFrameProps) {
  const { requestConsent, registerFrame, unregisterFrame, capabilities } = useNappletShell();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const windowIdRef = useRef<string>();
  const deliveryRef = useRef<NappletIntentDelivery | null>(null);
  const deliveredKeyRef = useRef("");
  const intentKey = intent ? JSON.stringify(intent) : "";
  const intentRef = useRef(intent);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const [napplet, setNapplet] = useState<ResolvedNapplet>();

  const title = getNappletTitle(event);
  const address = getNappletNaddr(event);

  useEffect(() => {
    intentRef.current = intent;
  }, [intent]);

  // Resolve (and re-resolve on reload) the napplet from its manifest event.
  useEffect(() => {
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
  }, [event, reloadKey, requestConsent, onResolved, onError]);

  useEffect(() => {
    return () => {
      if (windowIdRef.current) unregisterFrame(windowIdRef.current);
      deliveryRef.current?.dispose();
    };
  }, [unregisterFrame]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      deliveryRef.current?.observeReady(event);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const setIframe = useCallback(
    (node: HTMLIFrameElement | null) => {
      iframeRef.current = node;
      if (!node || !napplet || !node.contentWindow) return;

      // Register before assigning srcdoc so early shell.ready messages can route.
      if (windowIdRef.current) unregisterFrame(windowIdRef.current);
      deliveryRef.current?.dispose();

      const windowId = `napplet:${event.id}:${reloadKey}`;
      windowIdRef.current = windowId;
      registerFrame(windowId, node.contentWindow, {
        pubkey: event.pubkey,
        dTag: napplet.dTag,
        aggregateHash: napplet.aggregateHash,
        title,
      });

      const delivery = createNappletIntentDelivery({ getTarget: () => iframeRef.current?.contentWindow ?? null });
      deliveryRef.current = delivery;

      const seeded = intentRef.current;
      if (seeded) {
        delivery.seed(seeded);
        deliveredKeyRef.current = JSON.stringify(seeded);
      } else {
        deliveredKeyRef.current = "";
      }

      // Inject the same domain set shell.init advertises, so supports() and the
      // materialised window.napplet.<domain> proxies never diverge.
      node.srcdoc = injectNappletNamespacePrelude(napplet.indexHtml, { domains: capabilities.domains });
    },
    [event.id, event.pubkey, napplet, registerFrame, reloadKey, unregisterFrame, capabilities.domains, title],
  );

  const reload = useCallback(() => {
    if (windowIdRef.current) unregisterFrame(windowIdRef.current);
    deliveryRef.current?.dispose();
    windowIdRef.current = undefined;
    deliveryRef.current = null;
    deliveredKeyRef.current = "";
    setReloadKey((key) => key + 1);
  }, [unregisterFrame]);

  useEffect(() => {
    if (!intent || !intentKey) return;
    if (deliveredKeyRef.current === intentKey) return;

    const delivery = deliveryRef.current;
    if (!delivery) return;

    deliveredKeyRef.current = intentKey;
    delivery.redeliver(intent);
  }, [intent, intentKey]);

  return (
    <SimpleView
      title={title}
      flush
      scroll={false}
      gap={0}
      actions={
        <ButtonGroup size="sm" variant="ghost" ms="auto">
          {address && (
            <Tooltip label="App details" openDelay={500}>
              <IconButton as={RouterLink} to={`/app/store/${address}`} icon={<InfoIcon />} aria-label="App details" />
            </Tooltip>
          )}
          <Tooltip label="Reload" openDelay={500}>
            <IconButton icon={<RepeatIcon />} aria-label="Reload napplet" onClick={reload} />
          </Tooltip>
          {onClose && (
            <Tooltip label="Close" openDelay={500}>
              <IconButton icon={<CloseIcon />} aria-label="Close napplet" onClick={onClose} />
            </Tooltip>
          )}
        </ButtonGroup>
      }
    >
      {loading && (
        <Flex flexGrow={1} h={0} alignItems="center" justifyContent="center">
          <Spinner />
        </Flex>
      )}
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {napplet && !loading && !error && (
        <Box
          as="iframe"
          key={reloadKey}
          ref={setIframe}
          sandbox="allow-scripts"
          flexGrow={1}
          h={0}
          w="full"
          border="none"
          display="block"
        />
      )}
    </SimpleView>
  );
}
