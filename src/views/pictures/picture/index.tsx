import { ButtonGroup, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import EventQuoteButton from "~/components/note/event-quote-button";
import EventShareButton from "~/components/timeline/note/components/event-share-button";
import PicturePostContents from "~/components/picture-post/picture-post-content";
import PicturePostSlides from "~/components/picture-post/picture-slides";
import useParamsEventPointer from "~/hooks/use-params-event-pointer";
import useSingleEvent from "~/hooks/use-single-event";
import { useBreakpointValue } from "~/providers/global/breakpoint-provider";
import { ContentSettingsProvider } from "~/providers/local/content-settings";
import SimpleView from "../../../components/layout/presets/simple-view";
import NoteReactions from "../../../components/timeline/note/components/note-reactions";
import PicturePostMenu from "../../../components/picture-post/picture-menu";
import UserName from "../../../components/user/user-name";
import EventZapButton from "../../../components/zap/event-zap-button";
import PicturePostCommentForm from "./media-post-comment-form";
import { PicturePostComments } from "./picture-comments";

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
