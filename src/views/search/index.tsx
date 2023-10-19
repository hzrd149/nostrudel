import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, ButtonGroup, Flex, IconButton, Input, Link, Text, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAsync } from "react-use";

import { SEARCH_RELAYS } from "../../const";
import { NostrEvent } from "../../types/nostr-event";
import { safeDecode } from "../../helpers/nip19";
import { getMatchHashtag } from "../../helpers/regexp";
import { parseKind0Event } from "../../helpers/user-metadata";
import { readablizeSats } from "../../helpers/bolt11";
import { searchParamsToJson } from "../../helpers/url";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { CopyToClipboardIcon, NotesIcon, QrCodeIcon } from "../../components/icons";
import QrScannerModal from "../../components/qr-scanner-modal";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import UserAvatar from "../../components/user-avatar";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import { embedNostrLinks, renderGenericUrl } from "../../components/embed-types";
import { UserLink } from "../../components/user-link";
import trustedUserStatsService, { NostrBandUserStats } from "../../services/trusted-user-stats";
import VerticalPageLayout from "../../components/vertical-page-layout";
import User01 from "../../components/icons/user-01";
import GenericNoteTimeline from "../../components/timeline-page/generic-note-timeline";
import Feather from "../../components/icons/feather";

function ProfileResult({ profile }: { profile: NostrEvent }) {
  const metadata = parseKind0Event(profile);

  const aboutContent = useMemo(() => {
    if (!metadata.about) return null;
    let content: EmbedableContent = [metadata.about.trim()];
    content = embedNostrLinks(content);
    content = embedUrls(content, [renderGenericUrl]);
    return content;
  }, [metadata.about]);

  const { value: stats } = useAsync(() => trustedUserStatsService.getUserStats(profile.pubkey), [profile.pubkey]);

  return (
    <Box>
      <UserAvatar pubkey={profile.pubkey} noProxy mr="2" float="left" />
      <UserLink pubkey={profile.pubkey} fontWeight="bold" fontSize="xl" isTruncated />
      <br />
      <UserDnsIdentityIcon pubkey={profile.pubkey} />
      <br />
      <Box whiteSpace="pre" overflow="hidden" maxH="xs" isTruncated>
        {aboutContent}
      </Box>
      {stats && (
        <>{stats.followers_pubkey_count && <Text>Followers: {readablizeSats(stats.followers_pubkey_count)}</Text>}</>
      )}
    </Box>
  );
}

function ProfileSearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();

  const timeline = useTimelineLoader(
    `${search}-profile-search`,
    searchRelays,
    { search: search || "", kinds: [Kind.Metadata] },
    { enabled: !!search },
  );

  const profiles = useSubject(timeline?.timeline) ?? [];

  const [profileStats, setProfileStats] = useState<Record<string, NostrBandUserStats>>({});
  useEffect(() => {
    for (const profile of profiles) {
      trustedUserStatsService.getUserStats(profile.pubkey).then((stats) => {
        if (!stats) return;
        setProfileStats((dir) => ({ ...dir, [stats.pubkey]: stats }));
      });
    }
  }, [profiles]);

  const sortedProfiles = useMemo(() => {
    return profiles.sort(
      (a, b) =>
        (profileStats[b.pubkey]?.followers_pubkey_count ?? 0) - (profileStats[a.pubkey]?.followers_pubkey_count ?? 0),
    );
  }, [profileStats, profiles]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      {sortedProfiles.map((event) => (
        <ProfileResult key={event.id} profile={event} />
      ))}
      <TimelineActionAndStatus timeline={timeline} />
    </IntersectionObserverProvider>
  );
}

function NoteSearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();

  const timeline = useTimelineLoader(
    `${search}-note-search`,
    searchRelays,
    { search: search || "", kinds: [Kind.Text] },
    { enabled: !!search },
  );

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <GenericNoteTimeline timeline={timeline} />
    </IntersectionObserverProvider>
  );
}

function ArticleSearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();

  const timeline = useTimelineLoader(
    `${search}-article-search`,
    searchRelays,
    { search: search || "", kinds: [Kind.Article] },
    { enabled: !!search },
  );

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <GenericNoteTimeline timeline={timeline} />
    </IntersectionObserverProvider>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const qrScannerModal = useDisclosure();
  const [searchParams, setSearchParams] = useSearchParams();
  const mergeSearchParams = useCallback(
    (params: Record<string, any>) => {
      setSearchParams((p) => ({ ...searchParamsToJson(p), ...params }), { replace: true });
    },
    [setSearchParams],
  );

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const type = searchParams.get("type") ?? "users";
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

    const hashTagMatch = getMatchHashtag().exec(cleanText);
    if (hashTagMatch) {
      navigate({ pathname: "/t/" + hashTagMatch[2].toLocaleLowerCase() }, { replace: true });
      return;
    }

    mergeSearchParams({ q: cleanText });
  };

  const readClipboard = useCallback(async () => {
    handleSearchText(await navigator.clipboard.readText());
  }, []);

  // set the search when the form is submitted
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    handleSearchText(searchInput);
  };

  let SearchResults = ProfileSearchResults;
  switch (type) {
    case "users":
      SearchResults = ProfileSearchResults;
      break;
    case "notes":
      SearchResults = NoteSearchResults;
      break;
    case "articles":
      SearchResults = ArticleSearchResults;
      break;
  }

  return (
    <VerticalPageLayout>
      <QrScannerModal isOpen={qrScannerModal.isOpen} onClose={qrScannerModal.onClose} onData={handleSearchText} />

      <form onSubmit={handleSubmit}>
        <Flex gap="2" wrap="wrap">
          <Flex gap="2" grow={1}>
            <IconButton onClick={qrScannerModal.onOpen} icon={<QrCodeIcon />} aria-label="Qr Scanner" />
            {!!navigator.clipboard.readText && (
              <IconButton onClick={readClipboard} icon={<CopyToClipboardIcon />} aria-label="Read clipboard" />
            )}
            <Input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <Button type="submit">Search</Button>
          </Flex>
        </Flex>
      </form>

      <Flex gap="2">
        <ButtonGroup size="sm" isAttached variant="outline">
          <Button
            leftIcon={<User01 />}
            colorScheme={type === "users" ? "primary" : undefined}
            onClick={() => mergeSearchParams({ type: "users" })}
          >
            Users
          </Button>
          <Button
            leftIcon={<NotesIcon />}
            colorScheme={type === "notes" ? "primary" : undefined}
            onClick={() => mergeSearchParams({ type: "notes" })}
          >
            Notes
          </Button>
          <Button
            leftIcon={<Feather />}
            colorScheme={type === "articles" ? "primary" : undefined}
            onClick={() => mergeSearchParams({ type: "articles" })}
          >
            Articles
          </Button>
        </ButtonGroup>
        <RelaySelectionButton ml="auto" size="sm" />
      </Flex>

      <Flex direction="column" gap="4">
        {search ? (
          <SearchResults search={search} />
        ) : (
          <Link isExternal href="https://nostr.band" color="blue.500" mx="auto">
            Advanced Search
          </Link>
        )}
      </Flex>
    </VerticalPageLayout>
  );
}

export default function SearchView() {
  return (
    <RelaySelectionProvider overrideDefault={SEARCH_RELAYS}>
      <SearchPage />
    </RelaySelectionProvider>
  );
}
