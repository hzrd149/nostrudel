import { Button, ButtonGroup, Card, CardBody, CardFooter, CardHeader, CardProps, Flex, Tag } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import { CompactNoteContent } from "../../../components/compact-note-content";
import { ReplyIcon } from "../../../components/icons";
import EventQuoteButton from "../../../components/note/event-quote-button";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import EventZapButton from "../../../components/zap/event-zap-button";
import { getHashtags } from "../../../helpers/nostr/stemstr";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import TrackDownloadButton from "./track-download-button";
import TrackMenu from "./track-menu";
import TrackPlayer from "./track-player";
import TrackStemstrButton from "./track-stemstr-button";

export default function TrackCard({ track, ...props }: { track: NostrEvent } & Omit<CardProps, "children">) {
  const hashtags = getHashtags(track);

  const ref = useEventIntersectionRef(track);

  return (
    <Card variant="outline" ref={ref} {...props}>
      <CardHeader display="flex" alignItems="center" p="2" pb="0" gap="2">
        <UserAvatarLink pubkey={track.pubkey} size="sm" />
        <UserLink pubkey={track.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <UserDnsIdentity pubkey={track.pubkey} onlyIcon />
        <Timestamp ml="auto" timestamp={track.created_at} />
      </CardHeader>
      <CardBody p="2" display="flex" gap="2" flexDirection="column">
        <TrackPlayer track={track} />
        <CompactNoteContent event={track} />
        {hashtags.length > 0 && (
          <Flex wrap="wrap" gap="2">
            {hashtags.map((hashtag) => (
              <Tag key={hashtag}>#{hashtag}</Tag>
            ))}
          </Flex>
        )}
      </CardBody>
      <CardFooter px="2" pt="0" pb="2" flexWrap="wrap" gap="2">
        <ButtonGroup size="sm" variant="ghost">
          <Button leftIcon={<ReplyIcon />} isDisabled>
            Comment
          </Button>
          <EventQuoteButton event={track} />
          <EventZapButton event={track} />
        </ButtonGroup>
        <ButtonGroup size="sm" ml="auto">
          <TrackDownloadButton track={track} />
          <TrackStemstrButton track={track} />
          <TrackMenu track={track} aria-label="Options" />
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}
