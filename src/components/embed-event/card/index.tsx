import { CardProps, Spinner } from "@chakra-ui/react";
import { DecodeResult } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { lazy, Suspense } from "react";

import { safeDecode } from "../../../helpers/nip19";
import { LIST_KINDS, SET_KINDS } from "../../../helpers/nostr/lists";
import { STEMSTR_TRACK_KIND } from "../../../helpers/nostr/stemstr";
import { TORRENT_COMMENT_KIND, TORRENT_KIND } from "../../../helpers/nostr/torrents";
import { FLARE_VIDEO_KIND } from "../../../helpers/nostr/video";
import { WIKI_PAGE_KIND } from "../../../helpers/nostr/wiki";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useSingleEvent from "../../../hooks/use-single-event";
import type { EmbeddedGoalOptions } from "./embedded-goal";
import EmbeddedNote from "./embedded-note";

import { DVM_CONTENT_DISCOVERY_JOB_KIND } from "../../../helpers/nostr/dvm";
import DVMCard from "../../../views/discovery/dvm-feed/components/dvm-card";
import LoadingNostrLink from "../../loading-nostr-link";
import EmbeddedDM from "./embedded-dm";
import EmbeddedSetOrList from "./embedded-list";
import EmbeddedReaction from "./embedded-reaction";
import EmbeddedRepost from "./embedded-repost";
import EmbeddedUnknown from "./embedded-unknown";

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
const EmbeddedStemstrTrack = lazy(() => import("./embedded-stemstr-track"));
const EmbeddedFile = lazy(() => import("./embedded-file"));

export type EmbedProps = {
  goalProps?: EmbeddedGoalOptions;
};

export function EmbedEventCard({
  event,
  goalProps,
  ...cardProps
}: Omit<CardProps, "children"> & { event: NostrEvent } & EmbedProps) {
  const renderContent = () => {
    switch (event.kind) {
      case kinds.ShortTextNote:
        return <EmbeddedNote event={event} {...cardProps} />;
      case kinds.Reaction:
        return <EmbeddedReaction event={event} {...cardProps} />;
      case kinds.EncryptedDirectMessage:
        return <EmbeddedDM dm={event} {...cardProps} />;
      case kinds.LiveEvent:
        return <EmbeddedStream stream={event} {...cardProps} />;
      case kinds.ZapGoal:
        return <EmbeddedGoal goal={event} {...cardProps} {...goalProps} />;
      case kinds.Emojisets:
        return <EmbeddedEmojiPack pack={event} {...cardProps} />;
      case kinds.LongFormArticle:
        return <EmbeddedArticle article={event} {...cardProps} />;
      case kinds.BadgeDefinition:
        return <EmbeddedBadge badge={event} {...cardProps} />;
      case kinds.LiveChatMessage:
        return <EmbeddedStreamMessage message={event} {...cardProps} />;
      case kinds.CommunityDefinition:
        return <EmbeddedCommunity community={event} {...cardProps} />;
      case STEMSTR_TRACK_KIND:
        return <EmbeddedStemstrTrack track={event} {...cardProps} />;
      case TORRENT_KIND:
        return <EmbeddedTorrent torrent={event} {...cardProps} />;
      case TORRENT_COMMENT_KIND:
        return <EmbeddedTorrentComment comment={event} {...cardProps} />;
      case FLARE_VIDEO_KIND:
        return <EmbeddedFlareVideo video={event} {...cardProps} />;
      case kinds.ChannelCreation:
        return <EmbeddedChannel channel={event} {...cardProps} />;
      case kinds.Repost:
      case kinds.GenericRepost:
        return <EmbeddedRepost repost={event} {...cardProps} />;
      case WIKI_PAGE_KIND:
        return <EmbeddedWikiPage page={event} {...cardProps} />;
      case kinds.Zap:
        return <EmbeddedZapRecept zap={event} {...cardProps} />;
      case kinds.FileMetadata:
        return <EmbeddedFile file={event} {...cardProps} />;
      case kinds.Handlerinformation:
        // if its a content DVM
        if (event.tags.some((t) => t[0] === "k" && t[1] === String(DVM_CONTENT_DISCOVERY_JOB_KIND)))
          return <DVMCard dvm={event} />;
    }

    if (SET_KINDS.includes(event.kind) || LIST_KINDS.includes(event.kind))
      return <EmbeddedSetOrList list={event} {...cardProps} />;

    return <EmbeddedUnknown event={event} {...cardProps} />;
  };

  return <Suspense fallback={<Spinner />}>{renderContent()}</Suspense>;
}

/** A component that takes a NIP-19 pointer or link and renders a card for the event */
export function EmbedEventPointerCard({
  pointer,
  ...props
}: { pointer: DecodeResult | string } & EmbedProps & Omit<CardProps, "children">) {
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
  return <EmbedEventCard event={event} {...props} />;
}
