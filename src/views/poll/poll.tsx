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

import GenericCommentForm from "../../components/comment/generic-comment-form";
import { ReplyIcon } from "../../components/icons";
import BookmarkEventButton from "../../components/note/bookmark-button";
import EventQuoteButton from "../../components/note/event-quote-button";
import NoteMenu from "../../components/note/note-menu";
import NotePublishedUsing from "../../components/note/note-published-using";
import SeenOnRelaysButton from "../../components/note/seen-on-relays-button";
import POWIcon from "../../components/pow/pow-icon";
import EventShareButton from "../../components/timeline/note/components/event-share-button";
import NoteProxyLink from "../../components/timeline/note/components/note-proxy-link";
import ZapBubbles from "../../components/timeline/note/components/zap-bubbles";
import Timestamp from "../../components/timestamp";
import UserAvatarLink from "../../components/user/user-avatar-link";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import UserLink from "../../components/user/user-link";
import VerticalPageLayout from "../../components/vertical-page-layout";
import EventZapButton from "../../components/zap/event-zap-button";
import ZaplessPollContent from "../../components/zapless-poll/zapless-poll-content";
import { isZaplessPoll } from "../../helpers/nostr/polls";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useParamsEventPointer from "../../hooks/use-params-event-pointer";
import useSingleEvent from "../../hooks/use-single-event";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import MutedNotePlaceholder from "../thread/components/muted-note-placeholder";
import PollDetailsTabs from "./components/details-tabs";

function PollDetails({ poll }: { poll: NostrEvent }) {
  const muteFilter = useClientSideMuteFilter();
  const ref = useEventIntersectionRef(poll);
  const isMuted = muteFilter(poll);
  const [alwaysShow, setAlwaysShow] = useState(false);
  const commentForm = useDisclosure();

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
            <ZaplessPollContent event={poll} />
          </ContentSettingsProvider>
        )}
      </CardBody>

      <CardFooter pt="0" gap="2" flexDirection="column" alignItems="stretch">
        <ZapBubbles event={poll} />
        <Flex gap="2" alignItems="center">
          <ButtonGroup variant="ghost" size="sm">
            <EventShareButton event={poll} />
            <IconButton
              icon={<ReplyIcon />}
              aria-label="Comment"
              title="Comment"
              onClick={commentForm.onOpen}
            />
            <EventQuoteButton event={poll} />
            <EventZapButton event={poll} />
          </ButtonGroup>
          <Spacer />
          <ButtonGroup size="sm" variant="ghost">
            <NoteProxyLink event={poll} />
            <BookmarkEventButton event={poll} aria-label="Bookmark" />
            <SeenOnRelaysButton event={poll} />
            <NoteMenu event={poll} aria-label="More Options" />
          </ButtonGroup>
        </Flex>
        {commentForm.isOpen && (
          <GenericCommentForm
            event={poll}
            onCancel={commentForm.onClose}
            onSubmitted={commentForm.onClose}
          />
        )}
      </CardFooter>
    </Card>
  );
}

export default function PollView() {
  const pointer = useParamsEventPointer("id");
  const poll = useSingleEvent(pointer);

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

      {poll && !isZaplessPoll(poll) && (
        <Alert status="warning">
          <AlertIcon />
          This event is not a zapless poll.
        </Alert>
      )}

      {poll && isZaplessPoll(poll) && (
        <>
          <PollDetails poll={poll} />
          <PollDetailsTabs poll={poll} />
        </>
      )}
    </VerticalPageLayout>
  );
}
