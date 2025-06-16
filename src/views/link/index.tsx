import { Alert, AlertIcon, AlertTitle, Button, Flex, Spinner, useDisclosure } from "@chakra-ui/react";
import { NostrEvent, kinds, nip19 } from "nostr-tools";
import { Navigate, useParams } from "react-router-dom";
import { DecodeResult, PICTURE_POST_KIND } from "applesauce-core/helpers";

import GenericCommentForm from "../../components/comment/generic-comment-form";
import { GenericComments } from "../../components/comment/generic-comments";
import { EmbedEventCard, EmbedEventPointerCard } from "../../components/embed-event/card";
import { ErrorBoundary } from "../../components/error-boundary";
import { ThreadIcon } from "../../components/icons";
import SimpleView from "../../components/layout/presets/simple-view";
import { TORRENT_KIND } from "../../helpers/nostr/torrents";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/video";
import { WIKI_PAGE_KIND } from "../../helpers/nostr/wiki";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import useSingleEvent from "../../hooks/use-single-event";

function LoadUnknownAddress({ pointer, link }: { pointer: nip19.AddressPointer; link: string }) {
  const event = useReplaceableEvent(pointer);
  if (!event) return <Spinner />;
  return <RenderRedirect event={event} link={link} />;
}
function LoadUnknownEvent({ pointer, link }: { pointer: nip19.EventPointer; link: string }) {
  const event = useSingleEvent(pointer);
  if (!event) return <Spinner />;
  return <RenderRedirect event={event} link={link} />;
}

function UnknownView({ pointer, event }: { pointer: DecodeResult; event?: NostrEvent }) {
  const comment = useDisclosure();

  return (
    <SimpleView title="Unknown event kind" maxW="4xl" center>
      {event ? <EmbedEventCard event={event} /> : <EmbedEventPointerCard pointer={pointer} />}

      {event && (
        <Flex mx="auto" maxW="4xl" w="full" gap="2" direction="column" mt="4">
          {comment.isOpen ? (
            <GenericCommentForm event={event} onCancel={comment.onClose} onSubmitted={comment.onClose} />
          ) : (
            <Button leftIcon={<ThreadIcon />} onClick={comment.onOpen} mr="auto">
              Comment
            </Button>
          )}

          <GenericComments event={event} />
        </Flex>
      )}
    </SimpleView>
  );
}

function RenderRedirect({ event, link }: { event?: NostrEvent; link: string }) {
  const decoded = nip19.decode(link);

  switch (decoded.type) {
    case "npub":
    case "nprofile":
      return <Navigate to={`/u/${link}`} replace />;
    case "note":
      return <Navigate to={`/n/${link}`} replace />;
    case "nevent":
    case "naddr": {
      const k = decoded.data.kind || event?.kind;
      if (k === kinds.ShortTextNote) return <Navigate to={`/n/${link}`} replace />;
      if (k === TORRENT_KIND) return <Navigate to={`/torrents/${link}`} replace />;
      if (k === kinds.LiveEvent) return <Navigate to={`/streams/${link}`} replace />;
      if (k === kinds.Emojisets) return <Navigate to={`/emojis/${link}`} replace />;
      if (k === kinds.Genericlists) return <Navigate to={`/lists/${link}`} replace />;
      if (k === kinds.Followsets) return <Navigate to={`/lists/${link}`} replace />;
      if (k === kinds.Bookmarksets) return <Navigate to={`/lists/${link}`} replace />;
      if (k === kinds.BadgeDefinition) return <Navigate to={`/badges/${link}`} replace />;
      if (k === FLARE_VIDEO_KIND) return <Navigate to={`/videos/${link}`} replace />;
      if (k === kinds.ChannelCreation) return <Navigate to={`/channels/${link}`} replace />;
      if (k === kinds.ShortTextNote) return <Navigate to={`/n/${link}`} replace />;
      if (k === kinds.LongFormArticle) return <Navigate to={`/articles/${link}`} replace />;
      if (k === WIKI_PAGE_KIND) return <Navigate to={`/wiki/page/${link}`} replace />;
      if (k === PICTURE_POST_KIND) return <Navigate to={`/pictures/${link}`} replace />;
      if (k === kinds.FileMetadata) return <Navigate to={`/files/${link}`} replace />;

      if (!event && decoded.type === "naddr") return <LoadUnknownAddress pointer={decoded.data} link={link} />;
      if (!event && decoded.type === "nevent") return <LoadUnknownEvent pointer={decoded.data} link={link} />;
    }
  }

  return <UnknownView pointer={decoded} event={event} />;
}

function NostrLinkPage() {
  const { link } = useParams() as { link?: string };

  if (!link)
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>No link provided</AlertTitle>
      </Alert>
    );

  const cleanLink = link.replace(/(web\+)?nostr:(\/\/)?/, "");

  return <RenderRedirect link={cleanLink} />;
}

export default function NostrLinkView() {
  return (
    <ErrorBoundary>
      <NostrLinkPage />
    </ErrorBoundary>
  );
}
