import { Alert, AlertIcon, Button, ButtonGroup, Flex, IconButton, Link, Spacer, useDisclosure } from "@chakra-ui/react";
import { Note } from "applesauce-common/casts";
import { use$, useEventStore } from "applesauce-react/hooks";
import { memo, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { ReplyIcon } from "../../../components/icons";
import Expand01 from "../../../components/icons/expand-01";
import Minus from "../../../components/icons/minus";
import BookmarkEventButton from "../../../components/note/bookmark-button";
import EventQuoteButton from "../../../components/note/event-quote-button";
import NoteMenu from "../../../components/note/note-menu";
import NotePublishedUsing from "../../../components/note/note-published-using";
import SeenOnRelaysButton from "../../../components/note/seen-on-relays-button";
import EventShareButton from "../../../components/timeline/note/components/event-share-button";
import NoteProxyLink from "../../../components/timeline/note/components/note-proxy-link";
import NoteReactions from "../../../components/timeline/note/components/note-reactions";
import ZapBubbles from "../../../components/timeline/note/components/zap-bubbles";
import { TextNoteContents } from "../../../components/timeline/note/text-note-contents";
import ZaplessPollContent from "../../../components/zapless-poll/zapless-poll-content";
import POWIcon from "../../../components/pow/pow-icon";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import EventZapButton from "../../../components/zap/event-zap-button";
import { isZaplessPoll } from "../../../helpers/nostr/polls";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useThreadColorLevelProps from "../../../hooks/use-thread-color-level-props";
import useAppSettings from "../../../hooks/use-user-app-settings";
import { useBreakpointValue } from "../../../providers/global/breakpoint-provider";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { getSharableEventAddress } from "../../../services/relay-hints";
import { countDescendantsInStore, repliesByDate } from "../helpers";
import DetailsTabs from "./details-tabs";
import MutedNotePlaceholder from "./muted-note-placeholder";
import ReplyForm from "./reply-form";

export type ThreadPostProps = {
  note: Note;
  initShowReplies?: boolean;
  focusId?: string;
  level?: number;
};

function ThreadPost({ note, initShowReplies, focusId, level = -1 }: ThreadPostProps) {
  const { showReactions } = useAppSettings();
  const replies = use$(() => note.replies$, [note]) ?? [];
  const expanded = useDisclosure({ defaultIsOpen: initShowReplies ?? (level < 2 || replies.length <= 1) });
  const replyForm = useDisclosure();

  const muteFilter = useClientSideMuteFilter();
  const eventStore = useEventStore();

  const isFocused = level === -1;
  // Recursive count over what's currently in the event store — no extra subscriptions.
  // Recomputes whenever this post's direct replies change.
  const numberOfReplies = useMemo(
    () => countDescendantsInStore(note.event.id, eventStore),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [note.event.id, eventStore, replies],
  );
  const isMuted = muteFilter(note.event);

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

  const colorProps = useThreadColorLevelProps(level, focusId === note.event.id);

  const header = (
    <Flex gap="2" alignItems="center">
      <UserAvatarLink pubkey={note.event.pubkey} size="sm" />
      <UserLink pubkey={note.event.pubkey} fontWeight="bold" isTruncated />
      <UserDnsIdentity pubkey={note.event.pubkey} onlyIcon />
      <Link as={RouterLink} whiteSpace="nowrap" color="current" to={`/n/${getSharableEventAddress(note.event)}`}>
        <Timestamp timestamp={note.event.created_at} />
      </Link>
      <POWIcon event={note.event} boxSize={5} />
      <NotePublishedUsing event={note.event} />
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
    const override = focusId === note.event.id ? false : undefined;

    return isMuted && !alwaysShow ? (
      muteAlert
    ) : isZaplessPoll(note.event) ? (
      <ContentSettingsProvider blurMedia={override} hideEmbeds={override} event={note.event}>
        <ZaplessPollContent event={note.event} pl="2" />
      </ContentSettingsProvider>
    ) : (
      <ContentSettingsProvider blurMedia={override} hideEmbeds={override} event={note.event}>
        <TextNoteContents event={note.event} pl="2" />
      </ContentSettingsProvider>
    );
  };

  const showReactionsOnNewLine = useBreakpointValue({ base: true, lg: false });
  const reactionButtons = showReactions && !isZaplessPoll(note.event) && (
    <NoteReactions event={note.event} flexWrap="wrap" variant="ghost" size="sm" />
  );
  const footer = (
    <Flex gap="2" alignItems="center">
      <ButtonGroup variant="ghost" size="sm">
        <IconButton aria-label="Reply" title="Reply" onClick={replyForm.onToggle} icon={<ReplyIcon />} />
        <EventShareButton event={note.event} />
        <EventQuoteButton event={note.event} />
        <EventZapButton event={note.event} />
      </ButtonGroup>
      {!showReactionsOnNewLine && reactionButtons}
      <Spacer />
      <ButtonGroup size="sm" variant="ghost">
        <NoteProxyLink event={note.event} />
        <BookmarkEventButton event={note.event} aria-label="Bookmark" />
        <SeenOnRelaysButton event={note.event} />
        <NoteMenu event={note.event} aria-label="More Options" />
      </ButtonGroup>
    </Flex>
  );

  const ref = useEventIntersectionRef(note.event);

  // If muted and has no replies, show placeholder instead of returning null
  // But still show the header and allow expansion
  if (isMuted && replies.length === 0 && !alwaysShow) {
    return (
      <>
        <Flex direction="column" gap="2" px="2" py="0" borderWidth="0 1px 0 .35rem" {...colorProps} ref={ref}>
          {header}
          {expanded.isOpen && (
            <>
              <MutedNotePlaceholder event={note.event} onShowAnyway={() => setAlwaysShow(true)} />
            </>
          )}
        </Flex>
        {replyForm.isOpen && (
          <ReplyForm event={note.event} onCancel={replyForm.onClose} onSubmitted={replyForm.onClose} />
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
            <ZapBubbles event={note.event} />
            {showReactionsOnNewLine && reactionButtons}
            {footer}
          </>
        )}
      </Flex>
      {replyForm.isOpen && (
        <ReplyForm event={note.event} onCancel={replyForm.onClose} onSubmitted={replyForm.onClose} />
      )}
      {isFocused ? (
        <DetailsTabs note={note} />
      ) : (
        expanded.isOpen &&
        replies.length > 0 && (
          <Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
            {repliesByDate(replies).map((child) => (
              <ThreadPost key={child.event.id} note={child} focusId={focusId} level={level + 1} />
            ))}
          </Flex>
        )
      )}
    </>
  );
}

export default memo(ThreadPost);
