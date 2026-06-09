import {
  Alert,
  AlertIcon,
  Box,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  IconButton,
  Spacer,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";

import { ReplyIcon } from "../../components/icons";
import BookmarkEventButton from "../../components/note/bookmark-button";
import EventQuoteButton from "../../components/note/event-quote-button";
import PollMenu from "../../components/poll/poll-menu";
import NotePublishedUsing from "../../components/note/note-published-using";
import SeenOnRelaysButton from "../../components/note/seen-on-relays-button";
import POWIcon from "../../components/pow/pow-icon";
import EventShareButton from "../../components/timeline/note/components/event-share-button";
import NoteProxyLink from "../../components/timeline/note/components/note-proxy-link";
import Timestamp from "../../components/timestamp";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import PollContent from "../../components/poll/poll-content";
import { isPoll } from "../../helpers/nostr/polls";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useRouteSearchValue from "../../hooks/use-route-search-value";
import useSingleEvent from "../../hooks/use-single-event";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import MutedNotePlaceholder from "../thread/components/muted-note-placeholder";
import PollDetailsTabs from "./components/details-tabs";

function PollDetails({ poll, onComment }: { poll: NostrEvent; onComment: () => void }) {
  const muteFilter = useClientSideMuteFilter();
  const ref = useEventIntersectionRef(poll);
  const isMuted = muteFilter(poll);
  const [alwaysShow, setAlwaysShow] = useState(false);

  return (
    <Card ref={ref} variant="outline">
      <CardHeader pb="2">
        <Flex gap="2" alignItems="center">
          <UserAvatarLink pubkey={poll.pubkey} size="md" />
          <Box minW={0}>
            <Flex gap="2" alignItems="center" wrap="wrap">
              <UserLink pubkey={poll.pubkey} fontWeight="bold" fontSize="lg" isTruncated />
              <UserDnsIdentity pubkey={poll.pubkey} onlyIcon />
              <Timestamp timestamp={poll.created_at} />
              <POWIcon event={poll} boxSize={5} />
              <NotePublishedUsing event={poll} />
            </Flex>
          </Box>
          <Spacer />
        </Flex>
      </CardHeader>

      <CardBody pt="2">
        {isMuted && !alwaysShow ? (
          <MutedNotePlaceholder event={poll} onShowAnyway={() => setAlwaysShow(true)} />
        ) : (
          <ContentSettingsProvider blurMedia={false} hideEmbeds={false} event={poll}>
            <PollContent event={poll} />
          </ContentSettingsProvider>
        )}
      </CardBody>

      <CardFooter pt="0" gap="2" flexDirection="column" alignItems="stretch">
        <Flex gap="2" alignItems="center">
          <ButtonGroup variant="ghost" size="sm">
            <EventShareButton event={poll} />
            <IconButton icon={<ReplyIcon />} aria-label="Comment" title="Comment" onClick={onComment} />
            <EventQuoteButton event={poll} />
          </ButtonGroup>
          <Spacer />
          <ButtonGroup size="sm" variant="ghost">
            <NoteProxyLink event={poll} />
            <BookmarkEventButton event={poll} aria-label="Bookmark" />
            <SeenOnRelaysButton event={poll} />
            <PollMenu event={poll} aria-label="More Options" />
          </ButtonGroup>
        </Flex>
      </CardFooter>
    </Card>
  );
}

export default function PollView() {
  const pointer = useParamsEventPointer("id");
  const poll = useSingleEvent(pointer);
  const selectedTab = useRouteSearchValue("tab", "comments");
  const commentForm = useDisclosure();

  const openCommentForm = () => {
    selectedTab.setValue("comments", true);
    commentForm.onOpen();
  };

  return (
    <VerticalPageLayout maxW="4xl" mx="auto" w="full">
      {!poll && (
        <>
          <Heading my="4">
            <Spinner /> Loading poll
          </Heading>
          <Box color="GrayText">{pointer.id}</Box>
        </>
      )}

      {poll && !isPoll(poll) && (
        <Alert status="warning">
          <AlertIcon />
          This event is not a poll.
        </Alert>
      )}

      {poll && isPoll(poll) && (
        <>
          <PollDetails poll={poll} onComment={openCommentForm} />
          <PollDetailsTabs poll={poll} showCommentForm={commentForm.isOpen} onCloseCommentForm={commentForm.onClose} />
        </>
      )}
    </VerticalPageLayout>
  );
}
