import { Box, ButtonGroup, Flex, Heading, Spacer, Spinner, Text } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import {
  getVideoDuration,
  getVideoImages,
  getVideoSummary,
  getVideoTitle,
  getVideoUrl,
} from "../../helpers/nostr/flare";
import { NostrEvent } from "../../types/nostr-event";
import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import UserAvatarLink from "../../components/user-avatar-link";
import UserLink from "../../components/user-link";
import { UserDnsIdentityIcon } from "../../components/user-dns-identity-icon";
import { UserFollowButton } from "../../components/user-follow-button";
import VideoMenu from "./components/video-menu";
import NoteZapButton from "../../components/note/note-zap-button";
import SimpleLikeButton from "../../components/event-reactions/simple-like-button";
import SimpleDislikeButton from "../../components/event-reactions/simple-dislike-button";
import { ErrorBoundary } from "../../components/error-boundary";
import QuoteRepostButton from "../../components/note/components/quote-repost-button";
import RepostButton from "../../components/note/components/repost-button";

function VideoDetailsPage({ video }: { video: NostrEvent }) {
  const title = getVideoTitle(video);
  const { thumb, image } = getVideoImages(video);
  const duration = getVideoDuration(video);
  const summary = getVideoSummary(video);
  const url = getVideoUrl(video);

  return (
    <VerticalPageLayout>
      <Flex gap="4">
        <Flex direction="column" gap="2" flexGrow={1}>
          <Box as="video" src={url} w="full" controls poster={image || thumb} />
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
            <UserDnsIdentityIcon pubkey={video.pubkey} onlyIcon />
            <UserFollowButton pubkey={video.pubkey} size="sm" />
            <ButtonGroup ml="auto" size="sm" variant="ghost">
              <QuoteRepostButton event={video} />
            </ButtonGroup>
            <VideoMenu video={video} aria-label="More options" size="sm" />
          </Flex>
          <Text mt="2" whiteSpace="pre-line">
            {summary}
          </Text>
        </Flex>
        <Flex gap="2" direction="column" w="sm" flexShrink={0}></Flex>
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
