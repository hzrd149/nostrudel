import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Flex, IconButton, Input, Link, Text, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAsync } from "react-use";

import { CopyToClipboardIcon, QrCodeIcon } from "../../components/icons";
import QrScannerModal from "../../components/qr-scanner-modal";
import { safeDecode } from "../../helpers/nip19";
import { getMatchHashtag } from "../../helpers/regexp";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import RelaySelectionProvider, { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import { NostrEvent } from "../../types/nostr-event";
import { parseKind0Event } from "../../helpers/user-metadata";
import { UserAvatar } from "../../components/user-avatar";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import { embedNostrLinks, renderGenericUrl } from "../../components/embed-types";
import { UserLink } from "../../components/user-link";
import trustedUserStatsService, { NostrBandUserStats } from "../../services/trusted-user-stats";
import { readablizeSats } from "../../helpers/bolt11";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { SEARCH_RELAYS } from "../../const";

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

function SearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();

  const timeline = useTimelineLoader(
    `${search}-search`,
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

    const hashTagMatch = getMatchHashtag().exec(cleanText);
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
          <RelaySelectionButton />
        </Flex>
      </form>

      <Flex direction="column" gap="8">
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
