import { memo, useState } from "react";
import { Alert, AlertIcon, Button, ButtonGroup, Flex, IconButton, Link, Spacer, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { ThreadItem } from "applesauce-core/queries";

import ReplyForm from "./reply-form";
import { ReplyIcon } from "../../../components/icons";
import { countReplies, repliesByDate } from "../../../helpers/thread";
import { TrustProvider } from "../../../providers/local/trust-provider";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import Timestamp from "../../../components/timestamp";
import Expand01 from "../../../components/icons/expand-01";
import Minus from "../../../components/icons/minus";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import useAppSettings from "../../../hooks/use-user-app-settings";
import useThreadColorLevelProps from "../../../hooks/use-thread-color-level-props";
import POWIcon from "../../../components/pow/pow-icon";
import ShareButton from "../../../components/note/timeline-note/components/share-button";
import QuoteEventButton from "../../../components/note/quote-event-button";
import NoteZapButton from "../../../components/note/note-zap-button";
import NoteProxyLink from "../../../components/note/timeline-note/components/note-proxy-link";
import BookmarkEventButton from "../../../components/note/bookmark-event";
import NoteMenu from "../../../components/note/note-menu";
import NoteCommunityMetadata from "../../../components/note/timeline-note/note-community-metadata";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import ZapBubbles from "../../../components/note/timeline-note/components/zap-bubbles";
import DetailsTabs from "./details-tabs";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { getSharableEventAddress } from "../../../services/relay-hints";
import NotePublishedUsing from "../../../components/note/note-published-using";

export type ThreadItemProps = {
  post: ThreadItem;
  initShowReplies?: boolean;
  focusId?: string;
  level?: number;
};

function ThreadPost({ post, initShowReplies, focusId, level = -1 }: ThreadItemProps) {
  const { showReactions } = useAppSettings();
  const expanded = useDisclosure({ defaultIsOpen: initShowReplies ?? (level < 2 || post.replies.size <= 1) });
  const replyForm = useDisclosure();

  const muteFilter = useClientSideMuteFilter();

  const isFocused = level === -1;
  const replies = Array.from(post.replies).filter((r) => !muteFilter(r.event));
  const numberOfReplies = countReplies(replies);
  const isMuted = muteFilter(post.event);

  const [alwaysShow, setAlwaysShow] = useState(false);
  const muteAlert = (
    <Alert status="warning">
      <AlertIcon />
      Muted user or note
      <Button size="xs" ml="auto" onClick={() => setAlwaysShow(true)}>
        Show anyway
      </Button>
    </Alert>
  );

  const colorProps = useThreadColorLevelProps(level, focusId === post.event.id);

  const header = (
    <Flex gap="2" alignItems="center">
      <UserAvatarLink pubkey={post.event.pubkey} size="sm" />
      <UserLink pubkey={post.event.pubkey} fontWeight="bold" isTruncated />
      <UserDnsIdentity pubkey={post.event.pubkey} onlyIcon />
      <Link as={RouterLink} whiteSpace="nowrap" color="current" to={`/n/${getSharableEventAddress(post.event)}`}>
        <Timestamp timestamp={post.event.created_at} />
      </Link>
      <POWIcon event={post.event} boxSize={5} />
      <NotePublishedUsing event={post.event} />
      <Spacer />
      {!isFocused &&
        (replies.length > 0 ? (
          <Button variant="ghost" onClick={expanded.onToggle} rightIcon={expanded.isOpen ? <Minus /> : <Expand01 />}>
            ({numberOfReplies})
          </Button>
        ) : (
          <IconButton
            variant="ghost"
            onClick={expanded.onToggle}
            icon={expanded.isOpen ? <Minus /> : <Expand01 />}
            aria-label={expanded.isOpen ? "Collapse" : "Expand"}
            title={expanded.isOpen ? "Collapse" : "Expand"}
          />
        ))}
    </Flex>
  );

  const renderContent = () => {
    return isMuted && !alwaysShow ? (
      muteAlert
    ) : (
      <>
        <NoteCommunityMetadata event={post.event} pl="2" />
        <TrustProvider trust={focusId === post.event.id ? true : undefined} event={post.event}>
          <TextNoteContents event={post.event} pl="2" />
        </TrustProvider>
      </>
    );
  };

  const showReactionsOnNewLine = useBreakpointValue({ base: true, lg: false });
  const reactionButtons = showReactions && (
    <NoteReactions event={post.event} flexWrap="wrap" variant="ghost" size="sm" />
  );
  const footer = (
    <Flex gap="2" alignItems="center">
      <ButtonGroup variant="ghost" size="sm">
        <IconButton aria-label="Reply" title="Reply" onClick={replyForm.onToggle} icon={<ReplyIcon />} />
        <ShareButton event={post.event} />
        <QuoteEventButton event={post.event} />
        <NoteZapButton event={post.event} />
      </ButtonGroup>
      {!showReactionsOnNewLine && reactionButtons}
      <Spacer />
      <ButtonGroup size="sm" variant="ghost">
        <NoteProxyLink event={post.event} />
        <BookmarkEventButton event={post.event} aria-label="Bookmark" />
        <NoteMenu event={post.event} aria-label="More Options" />
      </ButtonGroup>
    </Flex>
  );

  const ref = useEventIntersectionRef(post.event);

  if (isMuted && replies.length === 0) return null;

  return (
    <>
      <Flex
        direction="column"
        gap="2"
        p="2"
        borderRadius="md"
        borderWidth=".1rem .1rem .1rem .35rem"
        {...colorProps}
        ref={ref}
      >
        {header}
        {expanded.isOpen && (
          <>
            {renderContent()}
            <ZapBubbles event={post.event} />
            {showReactionsOnNewLine && reactionButtons}
            {footer}
          </>
        )}
      </Flex>
      {replyForm.isOpen && <ReplyForm item={post} onCancel={replyForm.onClose} onSubmitted={replyForm.onClose} />}
      {isFocused ? (
        <DetailsTabs post={post} />
      ) : (
        expanded.isOpen &&
        post.replies.size > 0 && (
          <Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
            {repliesByDate(post).map((child) => (
              <ThreadPost key={child.event.id} post={child} focusId={focusId} level={level + 1} />
            ))}
          </Flex>
        )
      )}
    </>
  );
}

export default memo(ThreadPost);
