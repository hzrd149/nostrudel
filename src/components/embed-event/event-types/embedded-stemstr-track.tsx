import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  Tag,
  Tooltip,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";
import { CompactNoteContent } from "../../compact-note-content";
import { getHashtags } from "../../../helpers/nostr/stemstr";
import { ReplyIcon } from "../../icons";
import Timestamp from "../../timestamp";
import TrackStemstrButton from "../../../views/tracks/components/track-stemstr-button";
import TrackDownloadButton from "../../../views/tracks/components/track-download-button";
import TrackPlayer from "../../../views/tracks/components/track-player";
import QuoteEventButton from "../../note/quote-event-button";
import NoteZapButton from "../../note/note-zap-button";

// example nevent1qqst32cnyhhs7jt578u7vp3y047dduuwjquztpvwqc43f3nvg8dh28gpzamhxue69uhhyetvv9ujuum5v4khxarj9eshquq4rxdxa
export default function EmbeddedStemstrTrack({ track, ...props }: Omit<CardProps, "children"> & { track: NostrEvent }) {
  const hashtags = getHashtags(track);

  return (
    <Card {...props}>
      <CardHeader display="flex" alignItems="center" p="2" pb="0" gap="2">
        <UserAvatarLink pubkey={track.pubkey} size="xs" />
        <UserLink pubkey={track.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
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
        <ButtonGroup size="sm">
          <Tooltip label="Coming soon...">
            <Button leftIcon={<ReplyIcon />} isDisabled>
              Comment
            </Button>
          </Tooltip>
          <QuoteEventButton event={track} />
          <NoteZapButton event={track} />
        </ButtonGroup>
        <ButtonGroup size="sm" ml="auto">
          <TrackDownloadButton track={track} />
          <TrackStemstrButton track={track} />
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}
