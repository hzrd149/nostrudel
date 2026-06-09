import { Alert, AlertIcon, Button, ButtonGroup, Flex, IconButton, Link, Spacer, useDisclosure } from "@chakra-ui/react";
import { COMMENT_KIND } from "applesauce-common/helpers";
import { RepliesModel } from "applesauce-common/models";
import { useEventModel, useEventStore } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { countDescendantsInStore } from "../../helpers/nostr/descendant-count";
import { sortByDate } from "../../helpers/nostr/event";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useThreadColorLevelProps from "../../hooks/use-thread-color-level-props";
import useAppSettings from "../../hooks/use-user-app-settings";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import { getSharableEventAddress } from "../../services/relay-hints";
import MutedNotePlaceholder from "../../views/thread/components/muted-note-placeholder";
import { ReplyIcon } from "../icons";
import Expand01 from "../icons/expand-01";
import Minus from "../icons/minus";
import BookmarkEventButton from "../note/bookmark-button";
import EventQuoteButton from "../note/event-quote-button";
import NoteMenu from "../note/note-menu";
import NotePublishedUsing from "../note/note-published-using";
import SeenOnRelaysButton from "../note/seen-on-relays-button";
import EventShareButton from "../timeline/note/components/event-share-button";
import NoteProxyLink from "../timeline/note/components/note-proxy-link";
import NoteReactions from "../timeline/note/components/note-reactions";
import ZapBubbles from "../timeline/note/components/zap-bubbles";
import { TextNoteContents } from "../timeline/note/text-note-contents";
import POWIcon from "../pow/pow-icon";
import Timestamp from "../timestamp";
import UserAvatarLink from "../user/user-avatar-link";
import UserDnsIdentity from "../user/user-dns-identity";
import UserLink from "../user/user-link";
import EventZapButton from "../zap/event-zap-button";
import GenericCommentForm from "./generic-comment-form";

export type CommentPostProps = {
  event: NostrEvent;
  level?: number;
};

function CommentPost({ event, level = 0 }: CommentPostProps) {
  const { showReactions } = useAppSettings();
  const replies = useEventModel(RepliesModel, [event]) ?? [];
  const sortedReplies = useMemo(() => [...replies].sort((a, b) => sortByDate(a, b)), [replies]);
  const expanded = useDisclosure({
    defaultIsOpen: level < 2 || replies.length <= 1,
  });
  const replyForm = useDisclosure();

  const muteFilter = useClientSideMuteFilter();
  const eventStore = useEventStore();

  const numberOfReplies = useMemo(
    () => countDescendantsInStore(event.id, eventStore, [COMMENT_KIND]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event.id, eventStore, replies],
  );
  const isMuted = muteFilter(event);

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

  const colorProps = useThreadColorLevelProps(level, false);

  const header = (
    <Flex gap="2" alignItems="center">
      <UserAvatarLink pubkey={event.pubkey} size="sm" />
      <UserLink pubkey={event.pubkey} fontWeight="bold" isTruncated />
      <UserDnsIdentity pubkey={event.pubkey} onlyIcon />
      <Link as={RouterLink} whiteSpace="nowrap" color="current" to={`/n/${getSharableEventAddress(event)}`}>
        <Timestamp timestamp={event.created_at} />
      </Link>
      <POWIcon event={event} boxSize={5} />
      <NotePublishedUsing event={event} />
      <Spacer />
      {replies.length > 0 ? (
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
      )}
    </Flex>
  );

  const renderContent = () => {
    return isMuted && !alwaysShow ? (
      muteAlert
    ) : (
      <ContentSettingsProvider blurMedia={false} hideEmbeds={false} event={event}>
        <TextNoteContents event={event} pl="2" />
      </ContentSettingsProvider>
    );
  };

  const showReactionsOnNewLine = useBreakpointValue({ base: true, lg: false });
  const reactionButtons = showReactions && <NoteReactions event={event} flexWrap="wrap" variant="ghost" size="sm" />;
  const footer = (
    <Flex gap="2" alignItems="center">
      <ButtonGroup variant="ghost" size="sm">
        <IconButton aria-label="Reply" title="Reply" onClick={replyForm.onToggle} icon={<ReplyIcon />} />
        <EventShareButton event={event} />
        <EventQuoteButton event={event} />
        <EventZapButton event={event} />
      </ButtonGroup>
      {!showReactionsOnNewLine && reactionButtons}
      <Spacer />
      <ButtonGroup size="sm" variant="ghost">
        <NoteProxyLink event={event} />
        <BookmarkEventButton event={event} aria-label="Bookmark" />
        <SeenOnRelaysButton event={event} />
        <NoteMenu event={event} aria-label="More Options" />
      </ButtonGroup>
    </Flex>
  );

  const ref = useEventIntersectionRef(event);

  if (isMuted && replies.length === 0 && !alwaysShow) {
    return (
      <>
        <Flex direction="column" gap="2" px="2" py="0" borderWidth="0 1px 0 .35rem" {...colorProps} ref={ref}>
          {header}
          {expanded.isOpen && <MutedNotePlaceholder event={event} onShowAnyway={() => setAlwaysShow(true)} />}
        </Flex>
        {replyForm.isOpen && (
          <GenericCommentForm event={event} onCancel={replyForm.onClose} onSubmitted={replyForm.onClose} />
        )}
      </>
    );
  }

  return (
    <>
      <Flex direction="column" gap="2" px="2" py="0" borderWidth="0 1px 0 .35rem" {...colorProps} ref={ref}>
        {header}
        {expanded.isOpen && (
          <>
            {renderContent()}
            <ZapBubbles event={event} />
            {showReactionsOnNewLine && reactionButtons}
            {footer}
          </>
        )}
      </Flex>
      {replyForm.isOpen && (
        <GenericCommentForm event={event} onCancel={replyForm.onClose} onSubmitted={replyForm.onClose} />
      )}
      {expanded.isOpen && sortedReplies.length > 0 && (
        <Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
          {sortedReplies.map((child) => (
            <CommentPost key={child.id} event={child} level={level + 1} />
          ))}
        </Flex>
      )}
    </>
  );
}

export default memo(CommentPost);
