import { Box, ButtonGroup, Flex, Heading, Spinner, Tag, Text } from "@chakra-ui/react";
import { getEventUID } from "applesauce-core/helpers";

import VerticalPageLayout from "../../components/vertical-page-layout";
import {
  FLARE_VIDEO_KIND,
  getVideoImages,
  getVideoSummary,
  getVideoTitle,
  getVideoUrl,
} from "../../helpers/nostr/flare";
import { NostrEvent } from "../../types/nostr-event";
import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import { UserFollowButton } from "../../components/user/user-follow-button";
import VideoMenu from "./components/video-menu";
import SimpleLikeButton from "../../components/event-reactions/simple-like-button";
import SimpleDislikeButton from "../../components/event-reactions/simple-dislike-button";
import { ErrorBoundary } from "../../components/error-boundary";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import VideoCard from "./components/video-card";
import UserName from "../../components/user/user-name";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import SimpleBookmarkButton from "../../components/simple-bookmark-button";
import NoteZapButton from "../../components/note/note-zap-button";
import QuoteEventButton from "../../components/note/quote-event-button";

function VideoRecommendations({ video }: { video: NostrEvent }) {
  const readRelays = useReadRelays();
  const { loader, timeline: videos } = useTimelineLoader(video.pubkey + "-videos", readRelays, {
    authors: [video.pubkey],
    kinds: [FLARE_VIDEO_KIND],
  });
  return <>{videos?.slice(0, 8).map((v) => <VideoCard key={getEventUID(v)} video={v} />)}</>;
}

function VideoDetailsPage({ video }: { video: NostrEvent }) {
  const title = getVideoTitle(video);
  const { thumb, image } = getVideoImages(video);
  const summary = getVideoSummary(video);
  const url = getVideoUrl(video);

  const showSideBar = useBreakpointValue({ base: false, xl: true });

  return (
    <VerticalPageLayout>
      <Flex gap="4">
        <Flex direction="column" gap="2" flexGrow={1}>
          <Box as="video" src={url} w="full" maxH="95vh" controls poster={image || thumb} />
          <Flex gap="2" overflow="hidden">
            <Heading size="md" my="2" isTruncated>
              {title}
            </Heading>
            <ButtonGroup ml="auto" size="sm" variant="ghost">
              <NoteZapButton event={video} />
              <SimpleLikeButton event={video} />
              <SimpleDislikeButton event={video} />
            </ButtonGroup>
          </Flex>
          <Flex gap="2" alignItems="center">
            <UserAvatarLink pubkey={video.pubkey} size="sm" />
            <UserLink pubkey={video.pubkey} fontSize="lg" tab="videos" />
            <UserDnsIdentity pubkey={video.pubkey} onlyIcon />
            <UserFollowButton pubkey={video.pubkey} size="sm" />
            <ButtonGroup ml="auto" size="sm" variant="ghost">
              <SimpleBookmarkButton event={video} aria-label="Bookmark video" title="Bookmark video" />
              <QuoteEventButton event={video} />
            </ButtonGroup>
            <VideoMenu video={video} aria-label="More options" size="sm" />
          </Flex>
          <Text mt="2" whiteSpace="pre-line">
            {summary}
          </Text>
          <Flex gap="2" wrap="wrap">
            {video.tags
              .filter((t) => t[0] === "t")
              .map((tag) => (
                <Tag key={tag[1]}>{tag[1]}</Tag>
              ))}
          </Flex>
        </Flex>
        {showSideBar && (
          <Flex gap="2" direction="column" w="sm" flexShrink={0}>
            <Heading size="sm">
              Other videos by <UserName pubkey={video.pubkey} />:
            </Heading>
            <VideoRecommendations video={video} />
          </Flex>
        )}
      </Flex>
    </VerticalPageLayout>
  );
}

export default function VideoDetailsView() {
  const pointer = useParamsAddressPointer("naddr");
  const video = useReplaceableEvent(pointer);

  if (!video) return <Spinner />;

  return (
    <ErrorBoundary>
      <VideoDetailsPage video={video} />
    </ErrorBoundary>
  );
}
