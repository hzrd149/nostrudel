import { useEffect, useMemo, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { useAsync } from "react-use";
import { kinds } from "nostr-tools";

import { NostrEvent } from "../../types/nostr-event";
import { parseMetadataContent } from "../../helpers/nostr/user-metadata";
import { readablizeSats } from "../../helpers/bolt11";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import UserAvatar from "../../components/user/user-avatar";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import { embedNostrLinks, renderGenericUrl } from "../../components/embed-types";
import UserLink from "../../components/user/user-link";
import trustedUserStatsService, { NostrBandUserStats } from "../../services/trusted-user-stats";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { usePeopleListContext } from "../../providers/local/people-list-provider";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";

function ProfileResult({ profile }: { profile: NostrEvent }) {
  const metadata = parseMetadataContent(profile);

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
      <UserDnsIdentity pubkey={profile.pubkey} />
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

export default function ProfileSearchResults({ search }: { search: string }) {
  const searchRelays = useAdditionalRelayContext();

  const { listId, filter } = usePeopleListContext();
  const timeline = useTimelineLoader(
    `${listId ?? "global"}-${search}-profile-search`,
    searchRelays,
    search ? { search: search, kinds: [kinds.Metadata], ...filter } : undefined,
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
