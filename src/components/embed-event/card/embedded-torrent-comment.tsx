import { Card, CardProps, Flex, LinkBox, Spacer, Text } from "@chakra-ui/react";
import { nip19, NostrEvent } from "nostr-tools";
import { MouseEventHandler, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { getThreadReferences } from "../../../helpers/nostr/event";
import { getTorrentTitle } from "../../../helpers/nostr/torrents";
import useSingleEvent from "../../../hooks/use-single-event";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import { CompactNoteContent } from "../../compact-note-content";
import HoverLinkOverlay from "../../hover-link-overlay";
import Timestamp from "../../timestamp";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function EmbeddedTorrentComment({
  comment,
  ...props
}: Omit<CardProps, "children"> & { comment: NostrEvent }) {
  const navigate = useNavigate();
  const refs = getThreadReferences(comment);
  const torrent = useSingleEvent(refs.root?.e);
  const linkToTorrent = refs.root?.e && `/torrents/${nip19.neventEncode(refs.root.e)}`;

  const handleClick = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault();
      if (linkToTorrent) navigate(linkToTorrent);
    },
    [navigate, linkToTorrent],
  );

  return (
    <ContentSettingsProvider event={comment}>
      <Card as={LinkBox} {...props}>
        <Flex p="2" gap="2" alignItems="center">
          <UserAvatarLink pubkey={comment.pubkey} size="xs" />
          <UserLink pubkey={comment.pubkey} fontWeight="bold" isTruncated fontSize="lg" />
          <Text>Commented on</Text>
          <HoverLinkOverlay as={RouterLink} to={linkToTorrent} fontWeight="bold" onClick={handleClick}>
            {torrent ? getTorrentTitle(torrent) : "torrent"}
          </HoverLinkOverlay>
          <Spacer />
          <Timestamp timestamp={comment.created_at} />
        </Flex>
        <CompactNoteContent px="2" event={comment} maxLength={96} />
      </Card>
    </ContentSettingsProvider>
  );
}
