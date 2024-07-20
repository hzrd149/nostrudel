import { Suspense, lazy } from "react";
import type { DecodeResult } from "nostr-tools/nip19";
import { CardProps, Spinner } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import EmbeddedNote from "./event-types/embedded-note";
import useSingleEvent from "../../hooks/use-single-event";
import { NostrEvent } from "../../types/nostr-event";
import { STREAM_CHAT_MESSAGE_KIND, STREAM_KIND } from "../../helpers/nostr/stream";
import { GOAL_KIND } from "../../helpers/nostr/goal";
import { EMOJI_PACK_KIND } from "../../helpers/nostr/emoji-packs";
import {
  BOOKMARK_LIST_KIND,
  CHANNELS_LIST_KIND,
  COMMUNITIES_LIST_KIND,
  NOTE_LIST_KIND,
  PEOPLE_LIST_KIND,
} from "../../helpers/nostr/lists";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import { STEMSTR_TRACK_KIND } from "../../helpers/nostr/stemstr";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { safeDecode } from "../../helpers/nip19";

import RelayCard from "../../views/relays/components/relay-card";
import EmbeddedStream from "./event-types/embedded-stream";
import EmbeddedEmojiPack from "./event-types/embedded-emoji-pack";
import EmbeddedGoal, { EmbeddedGoalOptions } from "./event-types/embedded-goal";
import EmbeddedUnknown from "./event-types/embedded-unknown";
import EmbeddedList from "./event-types/embedded-list";
import EmbeddedArticle from "./event-types/embedded-article";
import EmbeddedBadge from "./event-types/embedded-badge";
import EmbeddedStreamMessage from "./event-types/embedded-stream-message";
import EmbeddedCommunity from "./event-types/embedded-community";
import EmbeddedReaction from "./event-types/embedded-reaction";
import EmbeddedDM from "./event-types/embedded-dm";
import { TORRENT_COMMENT_KIND, TORRENT_KIND } from "../../helpers/nostr/torrents";
import EmbeddedTorrent from "./event-types/embedded-torrent";
import EmbeddedTorrentComment from "./event-types/embedded-torrent-comment";
import EmbeddedChannel from "./event-types/embedded-channel";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/flare";
import EmbeddedFlareVideo from "./event-types/embedded-flare-video";
import LoadingNostrLink from "../loading-nostr-link";
import EmbeddedRepost from "./event-types/embedded-repost";
import { WIKI_PAGE_KIND } from "../../helpers/nostr/wiki";
import EmbeddedWikiPage from "./event-types/embedded-wiki-page";
import EmbeddedZapRecept from "./event-types/embedded-zap-receipt";
const EmbeddedStemstrTrack = lazy(() => import("./event-types/embedded-stemstr-track"));

export type EmbedProps = {
  goalProps?: EmbeddedGoalOptions;
};

export function EmbedEvent({
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
      case STREAM_KIND:
        return <EmbeddedStream event={event} {...cardProps} />;
      case GOAL_KIND:
        return <EmbeddedGoal goal={event} {...cardProps} {...goalProps} />;
      case EMOJI_PACK_KIND:
        return <EmbeddedEmojiPack pack={event} {...cardProps} />;
      case PEOPLE_LIST_KIND:
      case NOTE_LIST_KIND:
      case BOOKMARK_LIST_KIND:
      case COMMUNITIES_LIST_KIND:
      case CHANNELS_LIST_KIND:
        return <EmbeddedList list={event} {...cardProps} />;
      case kinds.LongFormArticle:
        return <EmbeddedArticle article={event} {...cardProps} />;
      case kinds.BadgeDefinition:
        return <EmbeddedBadge badge={event} {...cardProps} />;
      case STREAM_CHAT_MESSAGE_KIND:
        return <EmbeddedStreamMessage message={event} {...cardProps} />;
      case COMMUNITY_DEFINITION_KIND:
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
    }

    return <EmbeddedUnknown event={event} {...cardProps} />;
  };

  return <Suspense fallback={<Spinner />}>{renderContent()}</Suspense>;
}

export function EmbedEventPointer({ pointer, ...props }: { pointer: DecodeResult } & EmbedProps) {
  switch (pointer.type) {
    case "note": {
      const event = useSingleEvent(pointer.data);
      if (!event) return <LoadingNostrLink link={pointer} />;
      return <EmbedEvent event={event} {...props} />;
    }
    case "nevent": {
      const event = useSingleEvent(pointer.data.id, pointer.data.relays);
      if (!event) return <LoadingNostrLink link={pointer} />;
      return <EmbedEvent event={event} {...props} />;
    }
    case "naddr": {
      const event = useReplaceableEvent(pointer.data, pointer.data.relays);
      if (!event) return <LoadingNostrLink link={pointer} />;
      return <EmbedEvent event={event} {...props} />;
    }
    case "nrelay":
      return <RelayCard url={pointer.data} />;
  }
  return null;
}

export function EmbedEventNostrLink({ link, ...props }: { link: string } & EmbedProps) {
  const pointer = safeDecode(link);

  return pointer ? <EmbedEventPointer pointer={pointer} {...props} /> : <>{link}</>;
}
