import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { CloseIcon, RepeatIcon } from "@chakra-ui/icons";
import { NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useRef, useState } from "react";
import { openNappletArtifactCache, resolveNapplet, type ResolvedNapplet } from "@kehto/nip";
import { injectNappletNamespacePrelude } from "@kehto/shell";
import { resolveBlob } from "blossom-client-sdk/actions/resolve";

import Menu01 from "../icons/menu-01";
import SimpleView from "../layout/presets/simple-view";
import Timestamp from "../timestamp";
import NappletInfoDrawer from "./napplet-info-drawer";
import {
  NAPPLET_KIND_SNAPSHOT,
  getNappletRequiredCapabilities,
  getNappletNaddr,
  getNappletTitle,
  getUnsupportedNappletRequirements,
  type NappletIntent,
} from "../../helpers/nostr/napplets";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";
import { installNapplet, isNappletInstalled } from "../../services/installed-napplets";
import { createNappletIntentDelivery, type NappletIntentDelivery } from "../../services/napplet-intent-delivery";

export type NappletFrameProps = {
  event: NostrEvent;
  intent?: NappletIntent;
  onClose?: () => void;
  onResolved?: (napplet: ResolvedNapplet) => void;
  onError?: (error: Error) => void;
};

let nappletArtifactCachePromise: ReturnType<typeof openNappletArtifactCache> | undefined;

function getNappletArtifactCache() {
  nappletArtifactCachePromise ??= openNappletArtifactCache();
  return nappletArtifactCachePromise;
}

async function fetchNappletBlob(sha256Hex: string, servers: readonly string[], signal: AbortSignal) {
  const response = await resolveBlob({ sha256: sha256Hex, ext: "", servers: [...servers], authors: [] }, { signal });
  return new Uint8Array(await response.arrayBuffer());
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
  const [version, setVersion] = useState<NostrEvent>();
  const info = useDisclosure();

  // The release currently running in the iframe: the selected historical one, or the latest.
  const active = version ?? event;

  // A rewind must never survive navigating to a different napplet.
  useEffect(() => {
    setVersion(undefined);
  }, [event.id]);

  const title = getNappletTitle(active);
  const address = getNappletNaddr(event);
  const [installed, setInstalled] = useState(() => (address ? isNappletInstalled(address) : true));

  useEffect(() => {
    setInstalled(address ? isNappletInstalled(address) : true);
  }, [address]);

  useEffect(() => {
    intentRef.current = intent;
  }, [intent]);

  // Resolve (and re-resolve on reload/rewind) the napplet from its active manifest event.
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const capabilities = getNappletRequiredCapabilities(active);
    const unsupported = getUnsupportedNappletRequirements(active);

    async function load() {
      setLoading(true);
      setError(undefined);
      setNapplet(undefined);

      try {
        if (unsupported.length > 0) throw new Error(`Unsupported napplet requirements: ${unsupported.join(", ")}`);

        const cache = await getNappletArtifactCache();
        const resolved = await resolveNapplet({
          event: active,
          cache,
          fetchBlob: (sha256Hex, servers) => fetchNappletBlob(sha256Hex, servers, controller.signal),
        });
        const identity = { pubkey: active.pubkey, dTag: resolved.dTag, aggregateHash: resolved.aggregateHash };
        const allowed = await requestConsent(active, identity, capabilities);
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
      controller.abort();
    };
  }, [active, reloadKey, requestConsent, onResolved, onError]);

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

      // A rewound version has a different aggregateHash and must register as a distinct frame.
      const windowId = `napplet:${active.id}:${reloadKey}`;
      windowIdRef.current = windowId;
      registerFrame(windowId, node.contentWindow, {
        pubkey: active.pubkey,
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
    [active.id, active.pubkey, napplet, registerFrame, reloadKey, unregisterFrame, capabilities.domains, title],
  );

  // Shared frame teardown for both a plain reload and a rewind to a different version, so the
  // two paths cannot drift.
  const teardownFrame = useCallback(() => {
    if (windowIdRef.current) unregisterFrame(windowIdRef.current);
    deliveryRef.current?.dispose();
    windowIdRef.current = undefined;
    deliveryRef.current = null;
    deliveredKeyRef.current = "";
  }, [unregisterFrame]);

  const reload = useCallback(() => {
    teardownFrame();
    setReloadKey((key) => key + 1);
  }, [teardownFrame]);

  const selectVersion = useCallback(
    (next: NostrEvent) => {
      teardownFrame();
      setVersion(next.id === event.id ? undefined : next);
      setReloadKey((key) => key + 1);
    },
    [teardownFrame, event.id],
  );

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
          {address && !installed && (
            <Button
              colorScheme="primary"
              onClick={() => {
                installNapplet(event, address);
                setInstalled(true);
              }}
            >
              Install
            </Button>
          )}
          <Tooltip label="Reload" openDelay={500}>
            <IconButton icon={<RepeatIcon />} aria-label="Reload napplet" onClick={reload} />
          </Tooltip>
          <Tooltip label="Napplet info" openDelay={500}>
            <IconButton icon={<Menu01 />} aria-label="Napplet info" onClick={info.onOpen} />
          </Tooltip>
          {onClose && (
            <Tooltip label="Close" openDelay={500}>
              <IconButton icon={<CloseIcon />} aria-label="Close napplet" onClick={onClose} />
            </Tooltip>
          )}
        </ButtonGroup>
      }
    >
      {version && (
        <Alert status="info" flexShrink={0}>
          <AlertIcon />
          <AlertDescription flexGrow={1}>
            Viewing {version.kind === NAPPLET_KIND_SNAPSHOT ? "a snapshot" : "a historical version"} from{" "}
            <Timestamp timestamp={version.created_at} fontWeight="bold" />
          </AlertDescription>
          <Button variant="ghost" size="sm" flexShrink={0} onClick={() => selectVersion(event)}>
            Back to latest
          </Button>
        </Alert>
      )}
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
      <NappletInfoDrawer
        isOpen={info.isOpen}
        onClose={info.onClose}
        event={event}
        active={active}
        onSelect={selectVersion}
      />
    </SimpleView>
  );
}
