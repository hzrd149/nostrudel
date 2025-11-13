import { Flex, LinkBox, Text } from "@chakra-ui/react";
import { COMMENT_KIND, EventPointer, getNip10References, neventEncode } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { CompactNoteContent } from "../../../../components/compact-note-content";
import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import { isReply } from "../../../../helpers/nostr/event";
import useSingleEvent from "../../../../hooks/use-single-event";

function ReplyLine({ pointer }: { pointer: EventPointer }) {
  const parent = useSingleEvent(pointer);
  const account = useActiveAccount();

  // Don't show if parent is the current user's note
  if (!parent || parent.pubkey === account?.pubkey) return null;

  return (
    <>
      replying to <UserName pubkey={parent.pubkey} fontWeight="semibold" />
    </>
  );
}

export default function MentionCard({ event }: { event: NostrEvent }) {
  const link = useMemo(() => {
    return `/l/${neventEncode({ id: event.id, author: event.pubkey, kind: event.kind })}`;
  }, [event]);

  const replyParent = useMemo(() => {
    if (event.kind === kinds.ShortTextNote && isReply(event)) return getNip10References(event).reply?.e;
    return undefined;
  }, [event]);

  const getEventTypeLabel = () => {
    switch (event.kind) {
      case kinds.LongFormArticle:
        return "mentioned you in an article";
      case kinds.ShortTextNote:
        return "mentioned you in a note";
      case COMMENT_KIND:
        return "mentioned you in a comment";
      default:
        return "mentioned you";
    }
  };

  return (
    <Flex as={LinkBox} direction="column" overflow="hidden" p="2" gap="2">
      {/* Mention Info */}
      <Flex overflow="hidden" alignItems="center" gap="2">
        <UserAvatar pubkey={event.pubkey} size="sm" showNip05={false} />
        <UserName pubkey={event.pubkey} fontWeight="bold" />
        <HoverLinkOverlay as={RouterLink} to={link}>
          <Text color="gray.500" isTruncated>
            {getEventTypeLabel()} {replyParent && <ReplyLine pointer={replyParent} />}
          </Text>
        </HoverLinkOverlay>
        <Timestamp timestamp={event.created_at} ml="auto" />
      </Flex>

      {/* Content Preview */}
      <CompactNoteContent event={event} noOfLines={1} textOnly whiteSpace="initial" maxLength={128} />
    </Flex>
  );
}
