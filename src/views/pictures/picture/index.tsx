import { ButtonGroup, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import DebugEventButton from "~/components/debug-modal/debug-event-button";
import EventQuoteButton from "~/components/note/event-quote-button";
import EventShareButton from "~/components/note/timeline-note/components/event-share-button";
import PicturePostContents from "~/components/picture-post/picture-post-content";
import PicturePostSlides from "~/components/picture-post/picture-slides";
import BackButton from "~/components/router/back-button";
import UserAvatarLink from "~/components/user/user-avatar-link";
import UserDnsIdentity from "~/components/user/user-dns-identity";
import UserLink from "~/components/user/user-link";
import useParamsEventPointer from "~/hooks/use-params-event-pointer";
import useSingleEvent from "~/hooks/use-single-event";
import { useBreakpointValue } from "~/providers/global/breakpoint-provider";
import { ContentSettingsProvider } from "~/providers/local/content-settings";
import SimpleView from "../../../components/layout/presets/simple-view";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import PicturePostMenu from "../../../components/picture-post/picture-menu";
import UserName from "../../../components/user/user-name";
import EventZapButton from "../../../components/zap/event-zap-button";
import PicturePostCommentForm from "./media-post-comment-form";
import { PicturePostComments } from "./picture-comments";

function Header({ post }: { post: NostrEvent }) {
  return (
    <Flex gap="2">
      <BackButton />
      <UserAvatarLink pubkey={post.pubkey} />
      <Flex direction="column">
        <UserLink pubkey={post.pubkey} fontWeight="bold" />
        <UserDnsIdentity pubkey={post.pubkey} />
      </Flex>

      <ButtonGroup ml="auto">
        <EventShareButton event={post} />
        <EventQuoteButton event={post} />
        <DebugEventButton event={post} />
      </ButtonGroup>
    </Flex>
  );
}

function Actions({ post }: { post: NostrEvent }) {
  return (
    <Flex gap="2" role="toolbar" aria-label="Article actions">
      <EventZapButton event={post} size="sm" variant="ghost" showEventPreview={false} aria-label="Send zap" />
      <EventShareButton event={post} size="sm" variant="ghost" aria-label="Share post" />
      <EventQuoteButton event={post} size="sm" variant="ghost" aria-label="Quote post" />
      <NoteReactions event={post} size="sm" variant="ghost" aria-label="React to post" />
    </Flex>
  );
}

function HorizontalLayout({ post }: { post: NostrEvent }) {
  return (
    <SimpleView
      title={
        <Text>
          Picture by <UserName pubkey={post.pubkey} />
        </Text>
      }
      maxW="8xl"
      center
      actions={
        <ButtonGroup ms="auto">
          <PicturePostMenu post={post} aria-label="Post options" variant="ghost" />
        </ButtonGroup>
      }
    >
      <Flex direction="row" gap="2" overflow="hidden" h="full">
        <Flex overflow="hidden" w="full" h="full" direction="column" gap="2">
          <PicturePostSlides post={post} maxH="full" overflow="hidden" />

          <Actions post={post} />
        </Flex>

        <Flex direction="column" w="md" overflowY="auto" flexShrink={0}>
          <PicturePostContents post={post} />

          <Heading size="sm" mt="2">
            Comments:
          </Heading>
          <PicturePostCommentForm post={post} mb="2" />
          <PicturePostComments post={post} />
        </Flex>
      </Flex>
    </SimpleView>
  );
}

function VerticalLayout({ post }: { post: NostrEvent }) {
  return (
    <SimpleView
      title={
        <Text>
          Picture by <UserName pubkey={post.pubkey} />
        </Text>
      }
      actions={
        <ButtonGroup ms="auto">
          <PicturePostMenu post={post} aria-label="Post options" variant="ghost" />
        </ButtonGroup>
      }
    >
      <PicturePostSlides post={post} h="full" overflow="hidden" minH="50vh" />
      <PicturePostContents post={post} />

      <Actions post={post} />

      <Heading size="sm" my="2">
        Comments:
      </Heading>
      <PicturePostCommentForm post={post} mb="2" />
      <PicturePostComments post={post} />
    </SimpleView>
  );
}

function PicturePostPage({ post }: { post: NostrEvent }) {
  const Layout = useBreakpointValue({ base: VerticalLayout, xl: HorizontalLayout }) || VerticalLayout;

  return (
    <ContentSettingsProvider blurMedia={false}>
      <Layout post={post} />
    </ContentSettingsProvider>
  );
}

export default function PicturePostView() {
  const pointer = useParamsEventPointer("pointer");

  const post = useSingleEvent(pointer);

  if (post) return <PicturePostPage post={post} />;
  else return <Spinner />;
}
