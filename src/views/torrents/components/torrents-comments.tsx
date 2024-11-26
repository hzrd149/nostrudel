import { memo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Spacer,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import { ThreadItem, ThreadQuery } from "applesauce-core/queries";
import { useStoreQuery } from "applesauce-react/hooks";

import { NostrEvent } from "../../../types/nostr-event";
import { TORRENT_COMMENT_KIND } from "../../../helpers/nostr/torrents";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useThreadTimelineLoader from "../../../hooks/use-thread-timeline-loader";
import { countReplies, repliesByDate } from "../../../helpers/thread";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import useAppSettings from "../../../hooks/use-app-settings";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import Timestamp from "../../../components/timestamp";
import Minus from "../../../components/icons/minus";
import Expand01 from "../../../components/icons/expand-01";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { ReplyIcon } from "../../../components/icons";
import ReplyForm from "../../thread/components/reply-form";
import useThreadColorLevelProps from "../../../hooks/use-thread-color-level-props";
import TorrentCommentMenu from "./torrent-comment-menu";
import NoteReactions from "../../../components/note/timeline-note/components/note-reactions";
import NoteZapButton from "../../../components/note/note-zap-button";
import { TextNoteContents } from "../../../components/note/timeline-note/text-note-contents";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

export const ThreadPost = memo(({ post, level = -1 }: { post: ThreadItem; level?: number }) => {
  const { showReactions } = useAppSettings();
  const expanded = useDisclosure({ defaultIsOpen: level < 2 || post.replies.size <= 1 });
  const replyForm = useDisclosure();

  const muteFilter = useClientSideMuteFilter();

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

  if (isMuted && replies.length === 0) return null;

  const header = (
    <Flex gap="2" alignItems="center">
      <UserAvatarLink pubkey={post.event.pubkey} size="sm" />
      <UserLink pubkey={post.event.pubkey} fontWeight="bold" isTruncated />
      <UserDnsIdentity pubkey={post.event.pubkey} onlyIcon />
      <Timestamp timestamp={post.event.created_at} />
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
      <>
        <TrustProvider event={post.event}>
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
        <NoteZapButton event={post.event} />
      </ButtonGroup>
      {!showReactionsOnNewLine && reactionButtons}
      <Spacer />
      <ButtonGroup size="sm" variant="ghost">
        <TorrentCommentMenu comment={post.event} aria-label="More Options" />
      </ButtonGroup>
    </Flex>
  );

  const colorProps = useThreadColorLevelProps(level);

  const ref = useEventIntersectionRef(post.event);

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
        {expanded.isOpen && renderContent()}
        {expanded.isOpen && showReactionsOnNewLine && reactionButtons}
        {expanded.isOpen && footer}
      </Flex>
      {replyForm.isOpen && (
        <ReplyForm
          item={post}
          onCancel={replyForm.onClose}
          onSubmitted={replyForm.onClose}
          replyKind={TORRENT_COMMENT_KIND}
        />
      )}
      {post.replies.size > 0 && expanded.isOpen && (
        <Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
          {repliesByDate(post).map((child) => (
            <ThreadPost key={child.event.id} post={child} level={level + 1} />
          ))}
        </Flex>
      )}
    </>
  );
});

export default function TorrentComments({ torrent }: { torrent: NostrEvent }) {
  const readRelays = useReadRelays();
  const { timeline } = useThreadTimelineLoader(torrent, readRelays, [TORRENT_COMMENT_KIND]);

  const thread = useStoreQuery(ThreadQuery, [torrent.id]);

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      {thread?.root &&
        repliesByDate(thread.root).map((item) => <ThreadPost key={item.event.id} post={item} level={0} />)}
    </IntersectionObserverProvider>
  );
}
