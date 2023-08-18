import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  IconButton,
  Input,
  Link,
  SimpleGrid,
  useDisclosure,
} from "@chakra-ui/react";
import { useSearchParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { ClipboardIcon, QrCodeIcon } from "../../components/icons";
import QrScannerModal from "../../components/qr-scanner-modal";
import { safeDecode } from "../../helpers/nip19";
import { matchHashtag } from "../../helpers/regexp";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { Kind, nip19 } from "nostr-tools";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { NostrEvent } from "../../types/nostr-event";
import { getUserDisplayName, parseKind0Event } from "../../helpers/user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { EventRelays } from "../../components/note/note-relays";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { embedNostrLinks, renderGenericUrl } from "../../components/embed-types";
import { getEventRelays } from "../../services/event-relays";
import relayScoreboardService from "../../services/relay-scoreboard";

function buildDescriptionContent(description: string) {
  let content: EmbedableContent = [description.trim()];

  content = embedNostrLinks(content);
  content = embedUrls(content, [renderGenericUrl]);

  return content;
}

function ProfileResult({ event }: { event: NostrEvent }) {
  const metadata = parseKind0Event(event);

  const aboutContent = metadata.about && buildDescriptionContent(metadata.about);
  const nprofile = useMemo(() => {
    const relays = getEventRelays(event.id).value;
    const ranked = relayScoreboardService.getRankedRelays(relays).slice(2);
    return nip19.nprofileEncode({ pubkey: event.pubkey, relays: ranked });
  }, [event.id]);

  return (
    <Card overflow="hidden" variant="outline" size="sm">
      <CardHeader display="flex" gap="4" alignItems="flex-start">
        <UserAvatar pubkey={event.pubkey} noProxy />
        <Flex alignItems="center" gap="2" overflow="hidden">
          <Link as={RouterLink} to={`/u/${nprofile}`} whiteSpace="nowrap" fontWeight="bold" fontSize="xl" isTruncated>
            {getUserDisplayName(metadata, event.pubkey)}
          </Link>
          <UserDnsIdentityIcon pubkey={event.pubkey} onlyIcon />
        </Flex>
      </CardHeader>
      <CardBody py={0} overflow="hidden" maxH="20rem">
        {aboutContent && (
          <Box whiteSpace="pre" isTruncated>
            {aboutContent}
          </Box>
        )}
      </CardBody>
      <CardFooter>
        <EventRelays event={event} />
      </CardFooter>
    </Card>
  );
}

function SearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();

  const timeline = useTimelineLoader(
    `search`,
    searchRelays,
    { search: search || "", kinds: [Kind.Metadata] },
    { enabled: !!search },
  );

  const events = useSubject(timeline?.timeline) ?? [];

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="2">
        {events.map((event) => (
          <ProfileResult key={event.id} event={event} />
        ))}
      </SimpleGrid>

      <TimelineActionAndStatus timeline={timeline} />
    </IntersectionObserverProvider>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const qrScannerModal = useDisclosure();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const search = searchParams.get("q");

  // update the input value when search changes
  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSearchText = (text: string) => {
    const cleanText = text.trim();

    if (cleanText.startsWith("nostr:") || cleanText.startsWith("web+nostr:") || safeDecode(text)) {
      navigate({ pathname: "/l/" + encodeURIComponent(text) }, { replace: true });
      return;
    }

    const hashTagMatch = matchHashtag.exec(cleanText);
    if (hashTagMatch) {
      navigate({ pathname: "/t/" + hashTagMatch[2].toLocaleLowerCase() });
      return;
    }

    setSearchParams({ q: cleanText }, { replace: true });
  };

  const readClipboard = useCallback(async () => {
    handleSearchText(await navigator.clipboard.readText());
  }, []);

  // set the search when the form is submitted
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    handleSearchText(searchInput);
  };

  return (
    <Flex direction="column" py="2" px={["2", "2", 0]} gap="2">
      <QrScannerModal isOpen={qrScannerModal.isOpen} onClose={qrScannerModal.onClose} onData={handleSearchText} />

      <form onSubmit={handleSubmit}>
        <Flex gap="2" wrap="wrap">
          <Flex gap="2" grow={1}>
            <IconButton onClick={qrScannerModal.onOpen} icon={<QrCodeIcon />} aria-label="Qr Scanner" />
            {!!navigator.clipboard.readText && (
              <IconButton onClick={readClipboard} icon={<ClipboardIcon />} aria-label="Read clipboard" />
            )}
            <Input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <Button type="submit">Search</Button>
          </Flex>
          <RelaySelectionButton />
        </Flex>
      </form>

      {search && <SearchResults search={search} />}
    </Flex>
  );
}

// TODO: remove this when there is a good way to allow the user to select from a list of filtered relays that support NIP-50
const searchRelays = ["wss://relay.nostr.band", "wss://search.nos.today"];
export default function SearchView() {
  // const { value: searchRelays = ["wss://relay.nostr.band"] } = useAsync(async () => {
  //   const relays: string[] = await fetch("https://api.nostr.watch/v1/nip/50").then((res) => res.json());
  //   return relays;
  // });

  return (
    <RelaySelectionProvider overrideDefault={searchRelays}>
      <SearchPage />
    </RelaySelectionProvider>
  );
}
