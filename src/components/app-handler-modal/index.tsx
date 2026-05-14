import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Link,
  LinkBox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
} from "@chakra-ui/react";
import { NostrEvent, kinds } from "nostr-tools";
import {
  DecodeResult,
  encodeDecodeResult,
  getProfileContent,
  getReplaceableAddress,
  getReplaceableAddressFromPointer,
} from "applesauce-core/helpers";
import { getHandlerLinkTemplate } from "applesauce-common/helpers";

import { ExternalLinkIcon } from "../icons";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSingleEvent from "../../hooks/use-single-event";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { useReadRelays } from "../../hooks/use-client-relays";
import { getDisplayName } from "../../helpers/nostr/profile";
import { parseCoordinate } from "../../helpers/nostr/event";
import { MetadataAvatar } from "../user/user-avatar";
import HoverLinkOverlay from "../hover-link-overlay";
import ArrowRight from "../icons/arrow-right";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { CopyIconButton } from "../copy-icon-button";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import useAppSettings from "../../hooks/use-user-app-settings";
import { DEFAULT_SHARE_SERVICE } from "../../const";

function useEventFromDecode(decoded: DecodeResult) {
  switch (decoded.type) {
    case "note":
      return useSingleEvent(decoded.data);
    case "nevent":
      return useSingleEvent(decoded.data);
    case "naddr":
      return useReplaceableEvent(decoded.data);
  }
}
function getKindFromDecoded(decoded: DecodeResult) {
  switch (decoded.type) {
    case "naddr":
      return decoded.data.kind;
    case "nevent":
      return decoded.data.kind;
    case "note":
      return kinds.ShortTextNote;
    case "nprofile":
      return kinds.Metadata;
    case "npub":
      return kinds.Metadata;
  }
}

function AppHandler({ app, decoded }: { app: NostrEvent; decoded: DecodeResult }) {
  const metadata = useMemo(() => getProfileContent(app), [app]);
  const link = useMemo(
    () => getHandlerLinkTemplate(app, "web", decoded.type)?.replace("<bech32>", encodeDecodeResult(decoded)),
    [decoded, app],
  );

  const ref = useEventIntersectionRef(app);

  if (!link) return null;
  return (
    <Flex as={LinkBox} gap="2" py="2" px="4" alignItems="center" ref={ref} overflow="hidden" shrink={0}>
      <MetadataAvatar metadata={metadata} />
      <Box overflow="hidden">
        <HoverLinkOverlay fontWeight="bold" href={link} isExternal>
          {getDisplayName(metadata, app.pubkey)}
        </HoverLinkOverlay>
        <Text noOfLines={3}>{metadata?.about}</Text>
      </Box>
      <ArrowRight boxSize={6} ml="auto" />
    </Flex>
  );
}

export default function AppHandlerModal({
  decoded,
  isOpen,
  onClose,
}: { decoded: DecodeResult } & Omit<ModalProps, "children">) {
  const { shareService } = useAppSettings();
  const readRelays = useReadRelays();
  const event = useEventFromDecode(decoded);
  const kind = event?.kind ?? getKindFromDecoded(decoded);
  const alt = event?.tags.find((t) => t[0] === "alt")?.[1];
  const address = encodeDecodeResult(decoded);
  const eventFilter = useCallback((event: NostrEvent) => {
    return event.content.length > 0;
  }, []);
  const { loader, timeline: apps } = useTimelineLoader(
    `${kind}-apps`,
    readRelays,
    kind ? { kinds: [kinds.Handlerinformation], "#k": [String(kind)] } : { kinds: [kinds.Handlerinformation] },
    { eventFilter },
  );

  const autofocus = useBreakpointValue({ base: false, lg: true });
  const [search, setSearch] = useState("");

  const filteredApps = apps
    .filter((app) => {
      if (search.length > 1) {
        try {
          const parsed = getProfileContent(app);
          if (getDisplayName(parsed, app.pubkey).toLowerCase().includes(search.toLowerCase())) {
            return true;
          }
        } catch (error) {}
        return false;
      } else return true;
    })
    .filter((app) => {
      // filter out bad profiles in content
      try {
        getProfileContent(app);
        return true;
      } catch (error) {
        return false;
      }
    });
  const clientTag = useMemo(() => event?.tags.find((t) => t[0] === "client"), [event]);
  const clientPointer = useMemo(() => {
    const value = clientTag?.[2]?.trim();
    if (!value) return undefined;
    try {
      return parseCoordinate(value, true) ?? undefined;
    } catch {
      return undefined;
    }
  }, [clientTag]);
  const preferredApp = useReplaceableEvent(clientPointer);

  const orderedFilteredApps = useMemo(() => {
    if (!clientPointer) return filteredApps;
    const preferredAddress = getReplaceableAddressFromPointer(clientPointer);

    const inTimeline = filteredApps.find((app) => getReplaceableAddress(app) === preferredAddress);
    const preferred = inTimeline ?? preferredApp;
    if (!preferred) return filteredApps;

    const rest = filteredApps.filter((app) => getReplaceableAddress(app) !== preferredAddress);
    return [preferred, ...rest];
  }, [filteredApps, clientPointer, preferredApp]);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">{kind === 0 ? `View profile in` : `View event (k:${kind}) in`}</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" gap="2" flexDirection="column" p="0">
          {alt && (
            <Text fontStyle="italic" px="4">
              {alt}
            </Text>
          )}
          {apps.length > 4 && (
            <Box px="4">
              <Input
                type="search"
                placeholder="Search apps"
                autoFocus={autofocus}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
          )}

          <Flex gap="2" direction="column" overflowX="hidden" overflowY="auto" maxH="sm">
            <IntersectionObserverProvider callback={callback}>
              {orderedFilteredApps.map((app) => (
                <AppHandler decoded={decoded} app={app} key={app.id} />
              ))}
            </IntersectionObserverProvider>
          </Flex>

          <FormControl px="4">
            <FormLabel>Embed Code</FormLabel>
            <Flex gap="2" overflow="hidden">
              <Input readOnly value={"nostr:" + address} size="sm" />
              <CopyIconButton value={"nostr:" + address} size="sm" aria-label="Copy embed code" />
            </Flex>
          </FormControl>
          <FormControl px="4">
            <FormLabel>Share URL</FormLabel>
            <Flex gap="2" overflow="hidden">
              <Input readOnly value={(shareService || DEFAULT_SHARE_SERVICE) + address} size="sm" />
              <CopyIconButton
                value={(shareService || DEFAULT_SHARE_SERVICE) + address}
                size="sm"
                aria-label="Copy embed code"
              />
            </Flex>
          </FormControl>
        </ModalBody>

        <ModalFooter display="flex" gap="2" p="4">
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
