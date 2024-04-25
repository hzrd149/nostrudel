import { useMemo, useRef, useState } from "react";
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
import { NostrEvent, kinds, nip19 } from "nostr-tools";
import { encodeDecodeResult } from "../../helpers/nip19";
import { ExternalLinkIcon } from "../icons";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSingleEvent from "../../hooks/use-single-event";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { useReadRelays } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import { Kind0ParsedContent, getDisplayName, parseMetadataContent } from "../../helpers/nostr/user-metadata";
import { MetadataAvatar } from "../user/user-avatar";
import HoverLinkOverlay from "../hover-link-overlay";
import ArrowRight from "../icons/arrow-right";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider, {
  useRegisterIntersectionEntity,
} from "../../providers/local/intersection-observer";
import { getEventUID } from "nostr-idb";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { CopyIconButton } from "../copy-icon-button";

function useEventFromDecode(decoded: nip19.DecodeResult) {
  switch (decoded.type) {
    case "note":
      return useSingleEvent(decoded.data);
    case "nevent":
      return useSingleEvent(decoded.data.id, decoded.data.relays);
    case "naddr":
      return useReplaceableEvent(decoded.data, decoded.data.relays);
  }
}
function getKindFromDecoded(decoded: nip19.DecodeResult) {
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

function AppHandler({ app, decoded }: { app: NostrEvent; decoded: nip19.DecodeResult }) {
  const metadata = useMemo(() => parseMetadataContent(app), [app]);
  const link = useMemo(() => {
    const tag = app.tags.find((t) => t[0] === "web" && t[2] === decoded.type) || app.tags.find((t) => t[0] === "web");
    return tag ? tag[1].replace("<bech32>", encodeDecodeResult(decoded)) : undefined;
  }, [decoded, app]);

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(app));

  if (!link) return null;
  return (
    <Flex as={LinkBox} gap="2" py="2" px="4" alignItems="center" ref={ref} overflow="hidden" shrink={0}>
      <MetadataAvatar metadata={metadata} />
      <Box overflow="hidden">
        <HoverLinkOverlay fontWeight="bold" href={link} isExternal>
          {getDisplayName(metadata, app.pubkey)}
        </HoverLinkOverlay>
        <Text noOfLines={3}>{metadata.about}</Text>
      </Box>
      <ArrowRight boxSize={6} ml="auto" />
    </Flex>
  );
}

export default function AppHandlerModal({
  decoded,
  isOpen,
  onClose,
}: { decoded: nip19.DecodeResult } & Omit<ModalProps, "children">) {
  const readRelays = useReadRelays();
  const event = useEventFromDecode(decoded);
  const kind = event?.kind ?? getKindFromDecoded(decoded);
  const alt = event?.tags.find((t) => t[0] === "alt")?.[1];
  const address = encodeDecodeResult(decoded);
  const timeline = useTimelineLoader(
    `${kind}-apps`,
    readRelays,
    kind ? { kinds: [kinds.Handlerinformation], "#k": [String(kind)] } : { kinds: [kinds.Handlerinformation] },
  );

  const autofocus = useBreakpointValue({ base: false, lg: true });
  const [search, setSearch] = useState("");
  const apps = useSubject(timeline.timeline).filter((a) => a.content.length > 0);

  const filteredApps = apps.filter((app) => {
    if (search.length > 1) {
      try {
        const parsed = JSON.parse(app.content) as Kind0ParsedContent;
        if (getDisplayName(parsed, app.pubkey).toLowerCase().includes(search.toLowerCase())) {
          return true;
        }
      } catch (error) {}
      return false;
    } else return true;
  });
  const callback = useTimelineCurserIntersectionCallback(timeline);

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
              {filteredApps.map((app) => (
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
              <Input readOnly value={"https://njump.me/" + address} size="sm" />
              <CopyIconButton value={"https://njump.me/" + address} size="sm" aria-label="Copy embed code" />
            </Flex>
          </FormControl>
        </ModalBody>

        <ModalFooter display="flex" gap="2" p="4">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            as={Link}
            variant="outline"
            href={`https://nostrapp.link/#${address}?select=true`}
            isExternal
            rightIcon={<ExternalLinkIcon />}
            colorScheme="primary"
          >
            nostrapp.link
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
