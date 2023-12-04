import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardProps,
  Flex,
  IconButton,
  Image,
  Link,
  Tag,
  Tooltip,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatarLink from "../../user-avatar-link";
import UserLink from "../../user-link";
import { CompactNoteContent } from "../../compact-note-content";
import { getDownloadURL, getHashtags, getStreamURL } from "../../../helpers/nostr/stemstr";
import { DownloadIcon, ReplyIcon } from "../../icons";
import NoteZapButton from "../../note/note-zap-button";
import { QuoteRepostButton } from "../../note/components/quote-repost-button";
import Timestamp from "../../timestamp";
import { ReactNode } from "react";
import { LiveAudioPlayer } from "../../live-audio-player";

// example nevent1qqst32cnyhhs7jt578u7vp3y047dduuwjquztpvwqc43f3nvg8dh28gpzamhxue69uhhyetvv9ujuum5v4khxarj9eshquq4rxdxa
export default function EmbeddedStemstrTrack({ track, ...props }: Omit<CardProps, "children"> & { track: NostrEvent }) {
  const streamUrl = getStreamURL(track);
  const downloadUrl = getDownloadURL(track);

  let player: ReactNode | null = null;
  if (streamUrl) {
    player = <LiveAudioPlayer stream={streamUrl.url} w="full" />;
  } else if (downloadUrl) {
    player = (
      <Box as="audio" controls w="full">
        <source src={downloadUrl.url} type={downloadUrl.format} />
      </Box>
    );
  }

  const hashtags = getHashtags(track);

  return (
    <Card {...props}>
      <CardHeader display="flex" alignItems="center" p="2" pb="0" gap="2">
        <UserAvatarLink pubkey={track.pubkey} size="xs" />
        <UserLink pubkey={track.pubkey} isTruncated fontWeight="bold" fontSize="lg" />
        <Timestamp ml="auto" timestamp={track.created_at} />
      </CardHeader>
      <CardBody p="2" display="flex" gap="2" flexDirection="column">
        {player}
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
          <QuoteRepostButton event={track} />
          <NoteZapButton event={track} />
        </ButtonGroup>
        <ButtonGroup size="sm" ml="auto">
          {downloadUrl && (
            <IconButton
              as={Link}
              icon={<DownloadIcon />}
              aria-label="Download"
              title="Download"
              href={downloadUrl.url}
              download
              isExternal
            />
          )}
          <Button
            as={Link}
            leftIcon={<Image src="https://stemstr.app/favicon.svg" />}
            href={`https://stemstr.app/thread/${track.id}`}
            colorScheme="purple"
            isExternal
          >
            View on Stemstr
          </Button>
        </ButtonGroup>
      </CardFooter>
    </Card>
  );
}
