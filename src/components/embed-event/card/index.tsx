import { CardProps, Spinner } from "@chakra-ui/react";
import { DecodeResult, isValidZap } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { lazy, Suspense } from "react";

import { safeDecode } from "../../../helpers/nip19";
import { LIST_KINDS, SET_KINDS } from "../../../helpers/nostr/lists";
import { TORRENT_COMMENT_KIND, TORRENT_KIND } from "../../../helpers/nostr/torrents";
import { FLARE_VIDEO_KIND } from "../../../helpers/nostr/video";
import { WIKI_PAGE_KIND } from "../../../helpers/nostr/wiki";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useSingleEvent from "../../../hooks/use-single-event";
import EmbeddedNote from "./embedded-note";

import { isValidContentDVM } from "../../../helpers/nostr/dvm";
import LoadingNostrLink from "../../loading-nostr-link";
import EmbeddedDVM from "./embedded-dvm";

const EmbeddedDM = lazy(() => import("./embedded-dm"));
const EmbeddedSetOrList = lazy(() => import("./embedded-list"));
const EmbeddedReaction = lazy(() => import("./embedded-reaction"));
const EmbeddedRepost = lazy(() => import("./embedded-repost"));
const EmbeddedUnknown = lazy(() => import("./embedded-unknown"));
const EmbeddedGoal = lazy(() => import("./embedded-goal"));
const EmbeddedArticle = lazy(() => import("./embedded-article"));
const EmbeddedCommunity = lazy(() => import("./embedded-community"));
const EmbeddedBadge = lazy(() => import("./embedded-badge"));
const EmbeddedTorrent = lazy(() => import("./embedded-torrent"));
const EmbeddedTorrentComment = lazy(() => import("./embedded-torrent-comment"));
const EmbeddedChannel = lazy(() => import("./embedded-channel"));
const EmbeddedFlareVideo = lazy(() => import("./embedded-flare-video"));
const EmbeddedEmojiPack = lazy(() => import("./embedded-emoji-pack"));
const EmbeddedZapRecept = lazy(() => import("./embedded-zap-receipt"));
const EmbeddedWikiPage = lazy(() => import("./embedded-wiki-page"));
const EmbeddedStream = lazy(() => import("./embedded-stream"));
const EmbeddedStreamMessage = lazy(() => import("./embedded-stream-message"));
const EmbeddedFile = lazy(() => import("./embedded-file"));
const EmbeddedHighlight = lazy(() => import("./embedded-highlight"));

export function EmbedEventCard({ event, ...props }: Omit<CardProps, "children" | "as"> & { event: NostrEvent }) {
  const renderContent = () => {
    switch (event.kind) {
      case kinds.ShortTextNote:
        return <EmbeddedNote event={event} {...props} />;
      case kinds.Reaction:
        return <EmbeddedReaction event={event} {...props} />;
      case kinds.EncryptedDirectMessage:
        return <EmbeddedDM dm={event} {...props} />;
      case kinds.LiveEvent:
        return <EmbeddedStream stream={event} {...props} />;
      case kinds.ZapGoal:
        return <EmbeddedGoal goal={event} {...props} />;
      case kinds.Emojisets:
        return <EmbeddedEmojiPack pack={event} {...props} />;
      case kinds.LongFormArticle:
        return <EmbeddedArticle article={event} {...props} />;
      case kinds.BadgeDefinition:
        return <EmbeddedBadge badge={event} {...props} />;
      case kinds.LiveChatMessage:
        return <EmbeddedStreamMessage message={event} {...props} />;
      case kinds.CommunityDefinition:
        return <EmbeddedCommunity community={event} {...props} />;
      case TORRENT_KIND:
        return <EmbeddedTorrent torrent={event} {...props} />;
      case TORRENT_COMMENT_KIND:
        return <EmbeddedTorrentComment comment={event} {...props} />;
      case FLARE_VIDEO_KIND:
        return <EmbeddedFlareVideo video={event} {...props} />;
      case kinds.ChannelCreation:
        return <EmbeddedChannel channel={event} {...props} />;
      case kinds.Repost:
      case kinds.GenericRepost:
        return <EmbeddedRepost repost={event} {...props} />;
      case WIKI_PAGE_KIND:
        return <EmbeddedWikiPage page={event} {...props} />;
      case kinds.FileMetadata:
        return <EmbeddedFile file={event} {...props} />;
      case kinds.Highlights:
        return <EmbeddedHighlight highlight={event} {...props} />;
      case kinds.Handlerinformation:
        // if its a content DVM
        if (isValidContentDVM(event)) return <EmbeddedDVM dvm={event} />;
    }
    if (event.kind === kinds.Zap && isValidZap(event)) {
      return <EmbeddedZapRecept zap={event} {...props} />;
    } else if (SET_KINDS.includes(event.kind) || LIST_KINDS.includes(event.kind)) {
      return <EmbeddedSetOrList list={event} {...props} />;
    }

    return <EmbeddedUnknown event={event} {...props} />;
  };

  return <Suspense fallback={<Spinner />}>{renderContent()}</Suspense>;
}

/** A component that takes a NIP-19 pointer or link and renders a card for the event */
export function EmbedEventPointerCard({
  pointer,
  ...props
}: { pointer: DecodeResult | string } & Omit<CardProps, "children" | "as">) {
  const parsedPointer = typeof pointer === "string" ? safeDecode(pointer) : pointer;
  if (!parsedPointer) return null;

  pointer = parsedPointer;

  let event: NostrEvent | undefined = undefined;
  switch (pointer.type) {
    case "note":
      event = useSingleEvent(pointer.data);
      break;
    case "nevent":
      event = useSingleEvent(pointer.data);
      break;
    case "naddr":
      event = useReplaceableEvent(pointer.data);
      break;
  }

  if (!event) return <LoadingNostrLink link={pointer} />;
  return <EmbedEventCard event={event} variant="outline" {...props} />;
}
