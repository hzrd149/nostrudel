import { useState } from "react";
import {
  Alert,
  AlertIcon,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Link,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import { ReplyIcon } from "../../../components/icons";
import { countReplies, ThreadItem } from "../../../helpers/thread";
import { TrustProvider } from "../../../providers/trust";
import ReplyForm from "./reply-form";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import UserAvatarLink from "../../../components/user-avatar-link";
import { UserLink } from "../../../components/user-link";
import Timestamp from "../../../components/timestamp";
import { NoteContents } from "../../../components/note/text-note-contents";
import Expand01 from "../../../components/icons/expand-01";
import Minus from "../../../components/icons/minus";
import NoteZapButton from "../../../components/note/note-zap-button";
import { QuoteRepostButton } from "../../../components/note/components/quote-repost-button";
import { RepostButton } from "../../../components/note/components/repost-button";
import NoteMenu from "../../../components/note/note-menu";
import useSubject from "../../../hooks/use-subject";
import appSettings from "../../../services/settings/app-settings";
import { useBreakpointValue } from "../../../providers/breakpoint-provider";
import NoteReactions from "../../../components/note/components/note-reactions";
import BookmarkButton from "../../../components/note/components/bookmark-button";
import NoteCommunityMetadata from "../../../components/note/note-community-metadata";

const LEVEL_COLORS = ["green", "blue", "red", "purple", "yellow", "cyan", "pink"];

export type ThreadItemProps = {
  post: ThreadItem;
  initShowReplies?: boolean;
  focusId?: string;
  level?: number;
};

export const ThreadPost = ({ post, initShowReplies, focusId, level = -1 }: ThreadItemProps) => {
  const { showReactions } = useSubject(appSettings);
  const [expanded, setExpanded] = useState(initShowReplies ?? (level < 2 || post.replies.length <= 1));
  const toggle = () => setExpanded((v) => !v);
  const showReplyForm = useDisclosure();

  const muteFilter = useClientSideMuteFilter();

  const replies = post.replies.filter((r) => !muteFilter(r.event));
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

  const colorMode = useColorMode().colorMode;
  const color = LEVEL_COLORS[level % LEVEL_COLORS.length];
  const colorValue = colorMode === "light" ? 200 : 800;
  const focusColor = colorMode === "light" ? "blue.300" : "blue.700";

  const header = (
    <Flex gap="2" alignItems="center">
      <UserAvatarLink pubkey={post.event.pubkey} size="sm" />
      <UserLink pubkey={post.event.pubkey} fontWeight="bold" isTruncated />
      <Link as={RouterLink} whiteSpace="nowrap" color="current" to={`/n/${nip19.noteEncode(post.event.id)}`}>
        <Timestamp timestamp={post.event.created_at} />
      </Link>
      {replies.length > 0 ? (
        <Button variant="ghost" onClick={toggle} rightIcon={expanded ? <Minus /> : <Expand01 />}>
          ({numberOfReplies})
        </Button>
      ) : (
        <IconButton
          variant="ghost"
          onClick={toggle}
          icon={expanded ? <Minus /> : <Expand01 />}
          aria-label={expanded ? "Collapse" : "Expand"}
          title={expanded ? "Collapse" : "Expand"}
        />
      )}
    </Flex>
  );

  const renderContent = () => {
    return isMuted && !alwaysShow ? (
      muteAlert
    ) : (
      <>
        <NoteCommunityMetadata event={post.event} pl="2" />
        <TrustProvider trust={focusId === post.event.id ? true : undefined}>
          <NoteContents event={post.event} pl="2" />
        </TrustProvider>
      </>
    );
  };

  const showReactionsOnNewLine = useBreakpointValue({ base: true, md: false });
  const reactionButtons = showReactions && (
    <NoteReactions event={post.event} flexWrap="wrap" variant="ghost" size="sm" />
  );
  const footer = (
    <Flex gap="2" alignItems="center">
      <ButtonGroup variant="ghost" size="sm">
        <IconButton aria-label="Reply" title="Reply" onClick={showReplyForm.onToggle} icon={<ReplyIcon />} />

        <RepostButton event={post.event} />
        <QuoteRepostButton event={post.event} />
        <NoteZapButton event={post.event} />
      </ButtonGroup>
      {!showReactionsOnNewLine && reactionButtons}
      <BookmarkButton event={post.event} variant="ghost" aria-label="Bookmark" size="sm" ml="auto" />
      <NoteMenu event={post.event} variant="ghost" size="sm" aria-label="More Options" />
    </Flex>
  );

  return (
    <>
      <Flex
        direction="column"
        gap="2"
        p="2"
        borderRadius="md"
        borderWidth=".1rem .1rem .1rem .35rem"
        borderColor={focusId === post.event.id ? focusColor : undefined}
        borderLeftColor={color + "." + colorValue}
      >
        {header}
        {expanded && renderContent()}
        {expanded && showReactionsOnNewLine && reactionButtons}
        {expanded && footer}
      </Flex>
      {showReplyForm.isOpen && (
        <ReplyForm item={post} onCancel={showReplyForm.onClose} onSubmitted={showReplyForm.onClose} />
      )}
      {post.replies.length > 0 && expanded && (
        <Flex direction="column" gap="2" pl={{ base: 2, md: 4 }}>
          {post.replies.map((child) => (
            <ThreadPost key={child.event.id} post={child} focusId={focusId} level={level + 1} />
          ))}
        </Flex>
      )}
    </>
  );
};
