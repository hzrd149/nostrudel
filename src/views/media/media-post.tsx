import { ButtonGroup, Flex, Heading, Spinner } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { useReadRelays } from "../../hooks/use-client-relays";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserLink from "../../components/user/user-link";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import MediaPostSlides from "../../components/media-post/media-slides";
import MediaPostContents from "../../components/media-post/media-post-content";
import { TrustProvider } from "../../providers/local/trust-provider";
import DebugEventButton from "../../components/debug-modal/debug-event-button";
import ShareButton from "../../components/note/timeline-note/components/share-button";
import QuoteEventButton from "../../components/note/quote-event-button";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import EventZapIconButton from "../../components/zap/event-zap-icon-button";
import AddReactionButton from "../../components/note/timeline-note/components/add-reaction-button";
import EventReactionButtons from "../../components/event-reactions/event-reactions";
import { MediaPostComments } from "./media-comments";
import MediaPostCommentForm from "./media-post-comment-form";

function Header({ post }: { post: NostrEvent }) {
  return (
    <Flex gap="2">
      <UserAvatarLink pubkey={post.pubkey} />
      <Flex direction="column">
        <UserLink pubkey={post.pubkey} fontWeight="bold" />
        <UserDnsIdentity pubkey={post.pubkey} />
      </Flex>

      <ButtonGroup ml="auto">
        <ShareButton event={post} />
        <QuoteEventButton event={post} />
        <DebugEventButton event={post} />
      </ButtonGroup>
    </Flex>
  );
}

function Actions({ post }: { post: NostrEvent }) {
  return (
    <ButtonGroup size="md" variant="ghost">
      <EventZapIconButton event={post} aria-label="Zap post" />
      <AddReactionButton event={post} />
      <EventReactionButtons event={post} />
    </ButtonGroup>
  );
}

function HorizontalLayout({ post }: { post: NostrEvent }) {
  return (
    <Flex direction="column" pt="2" pb="4" gap="2" px="2" w="auto" h="100vh" overflow="hidden">
      <Header post={post} />

      <Flex direction="row" gap="2" overflow="hidden" h="full">
        <Flex overflow="hidden" w="full" h="full" direction="column" gap="2">
          <MediaPostSlides post={post} maxH="full" overflow="hidden" />

          <Actions post={post} />
        </Flex>

        <Flex direction="column" w="md" overflowY="auto" flexShrink={0}>
          <MediaPostContents post={post} />

          <Heading size="sm" mt="2">
            Comments:
          </Heading>
          <MediaPostCommentForm post={post} mb="2" />
          <MediaPostComments post={post} />
        </Flex>
      </Flex>
    </Flex>
  );
}

function VerticalLayout({ post }: { post: NostrEvent }) {
  return (
    <Flex direction="column" pt="2" pb="12" gap="2" px="2" w="full">
      <Header post={post} />

      <MediaPostSlides post={post} h="full" overflow="hidden" />
      <MediaPostContents post={post} />

      <Actions post={post} />

      <Heading size="sm" my="2">
        Comments:
      </Heading>
      <MediaPostCommentForm post={post} mb="2" />
      <MediaPostComments post={post} />
    </Flex>
  );
}

function MediaPostPage({ post }: { post: NostrEvent }) {
  const Layout = useBreakpointValue({ base: VerticalLayout, lg: HorizontalLayout }) || VerticalLayout;

  return (
    <TrustProvider trust>
      <Layout post={post} />
    </TrustProvider>
  );
}

export default function MediaPostView() {
  const pointer = useParamsEventPointer("pointer");
  const readRelays = useReadRelays(pointer.relays);

  const post = useSingleEvent(pointer.id, readRelays);

  if (post) return <MediaPostPage post={post} />;
  else return <Spinner />;
}
