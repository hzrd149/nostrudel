import { Alert, AlertIcon, Button, ButtonGroup, Flex, IconButton, Link, Spacer, useDisclosure } from "@chakra-ui/react";
import { ThreadItem } from "applesauce-core/models";
import { memo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { ReplyIcon } from "../../../components/icons";
import Expand01 from "../../../components/icons/expand-01";
import Minus from "../../../components/icons/minus";
import BookmarkEventButton from "../../../components/note/bookmark-button";
import EventQuoteButton from "../../../components/note/event-quote-button";
import NoteMenu from "../../../components/note/note-menu";
import NotePublishedUsing from "../../../components/note/note-published-using";
import EventShareButton from "../../../components/note/timeline-note/components/event-share-button";
import NoteProxyLink from "../../../components/note/timeline-note/components/note-proxy-link";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import ZapBubbles from "../../../components/note/timeline-note/components/zap-bubbles";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import POWIcon from "../../../components/pow/pow-icon";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import EventZapButton from "../../../components/zap/event-zap-button";
import { countReplies, repliesByDate } from "../../../helpers/thread";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useThreadColorLevelProps from "../../../hooks/use-thread-color-level-props";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { getSharableEventAddress } from "../../../services/relay-hints";
import DetailsTabs from "./details-tabs";
import ReplyForm from "./reply-form";
import SeenOnRelaysButton from "../../../components/note/seen-on-relays-button";

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
    const override = focusId === post.event.id ? false : undefined;

    return isMuted && !alwaysShow ? (
      muteAlert
    ) : (
      <ContentSettingsProvider blurMedia={override} hideEmbeds={override} event={post.event}>
        <TextNoteContents event={post.event} pl="2" />
      </ContentSettingsProvider>
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
        <EventShareButton event={post.event} />
        <EventQuoteButton event={post.event} />
        <EventZapButton event={post.event} />
      </ButtonGroup>
      {!showReactionsOnNewLine && reactionButtons}
      <Spacer />
      <ButtonGroup size="sm" variant="ghost">
        <NoteProxyLink event={post.event} />
        <BookmarkEventButton event={post.event} aria-label="Bookmark" />
        <SeenOnRelaysButton event={post.event} />
        <NoteMenu event={post.event} aria-label="More Options" />
      </ButtonGroup>
    </Flex>
  );

  const ref = useEventIntersectionRef(post.event);

  if (isMuted && replies.length === 0) return null;

  return (
    <>
      <Flex direction="column" gap="2" px="2" py="0" borderWidth="0 1px 0 .35rem" {...colorProps} ref={ref}>
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
