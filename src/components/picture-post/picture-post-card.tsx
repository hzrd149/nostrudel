import { Box, ButtonGroup, Card, CardBody, CardFooter, CardHeader, IconButton } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import UserAvatarLink from "../user/user-avatar-link";
import UserLink from "../user/user-link";
import UserDnsIdentity from "../user/user-dns-identity";
import DebugEventButton from "../debug-modal/debug-event-button";
import { ContentSettingsProvider } from "../../providers/local/content-settings";
import EventReactionButtons from "../event-reactions/event-reactions";
import AddReactionButton from "../note/timeline-note/components/add-reaction-button";
import EventShareButton from "../note/timeline-note/components/event-share-button";
import EventQuoteButton from "../note/event-quote-button";
import PicturePostSlides from "./picture-slides";
import PicturePostContents from "./picture-post-content";
import { getSharableEventAddress } from "../../services/relay-hints";
import { ThreadIcon } from "../icons";
import EventZapIconButton from "../zap/event-zap-icon-button";
import Timestamp from "../timestamp";

export default function PicturePost({ post }: { post: NostrEvent }) {
  const nevent = getSharableEventAddress(post);

  return (
    <ContentSettingsProvider event={post}>
      <Card maxW="2xl" mx="auto">
        <CardHeader display="flex" alignItems="center" gap="2" p="2">
          <UserAvatarLink pubkey={post.pubkey} />
          <Box>
            <UserLink pubkey={post.pubkey} fontWeight="bold" /> <Timestamp timestamp={post.created_at} />
            <br />
            <UserDnsIdentity pubkey={post.pubkey} />
          </Box>

          <IconButton
            as={RouterLink}
            to={`/pictures/${nevent}`}
            icon={<ThreadIcon boxSize={5} />}
            ml="auto"
            aria-label="Comments"
          />
        </CardHeader>

        <CardBody p="0" position="relative" display="flex" flexDirection="column" gap="2" minH="md">
          <PicturePostSlides post={post} />

          {post.content.length > 0 && <PicturePostContents post={post} px="2" />}
        </CardBody>

        <CardFooter p="2" display="flex" gap="2">
          <ButtonGroup size="sm" variant="ghost">
            <EventZapIconButton event={post} aria-label="Zap post" />
            <AddReactionButton event={post} />
            <EventReactionButtons event={post} max={4} />
          </ButtonGroup>

          <ButtonGroup size="sm" variant="ghost" ml="auto">
            <EventShareButton event={post} />
            <EventQuoteButton event={post} />
            <DebugEventButton event={post} variant="ghost" ml="auto" size="sm" alignSelf="flex-start" />
          </ButtonGroup>
        </CardFooter>
      </Card>
    </ContentSettingsProvider>
  );
}
