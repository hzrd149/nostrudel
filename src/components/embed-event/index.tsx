import { lazy } from "react";
import type { DecodeResult } from "nostr-tools/lib/types/nip19";
import { CardProps } from "@chakra-ui/react";
import { Kind, nip19 } from "nostr-tools";

import EmbeddedNote from "./event-types/embedded-note";
import useSingleEvent from "../../hooks/use-single-event";
import { NoteLink } from "../note-link";
import { NostrEvent } from "../../types/nostr-event";
import { STREAM_CHAT_MESSAGE_KIND, STREAM_KIND } from "../../helpers/nostr/stream";
import { GOAL_KIND } from "../../helpers/nostr/goal";
import { EMOJI_PACK_KIND } from "../../helpers/nostr/emoji-packs";
import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../../helpers/nostr/lists";
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
const EmbeddedStemstrTrack = lazy(() => import("./event-types/embedded-stemstr-track"));

export type EmbedProps = {
  goalProps?: EmbeddedGoalOptions;
};

export function EmbedEvent({
  event,
  goalProps,
  ...cardProps
}: Omit<CardProps, "children"> & { event: NostrEvent } & EmbedProps) {
  switch (event.kind) {
    case Kind.Text:
      return <EmbeddedNote event={event} {...cardProps} />;
    case Kind.Reaction:
      return <EmbeddedReaction event={event} {...cardProps} />;
    case Kind.EncryptedDirectMessage:
      return <EmbeddedDM dm={event} {...cardProps} />;
    case STREAM_KIND:
      return <EmbeddedStream event={event} {...cardProps} />;
    case GOAL_KIND:
      return <EmbeddedGoal goal={event} {...cardProps} {...goalProps} />;
    case EMOJI_PACK_KIND:
      return <EmbeddedEmojiPack pack={event} {...cardProps} />;
    case PEOPLE_LIST_KIND:
    case NOTE_LIST_KIND:
      return <EmbeddedList list={event} {...cardProps} />;
    case Kind.Article:
      return <EmbeddedArticle article={event} {...cardProps} />;
    case Kind.BadgeDefinition:
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
    case Kind.ChannelCreation:
      return <EmbeddedChannel channel={event} {...cardProps} />;
  }

  return <EmbeddedUnknown event={event} {...cardProps} />;
}

export function EmbedEventPointer({ pointer, ...props }: { pointer: DecodeResult } & EmbedProps) {
  switch (pointer.type) {
    case "note": {
      const event = useSingleEvent(pointer.data);
      if (event === undefined) return <NoteLink noteId={pointer.data} />;
      return <EmbedEvent event={event} {...props} />;
    }
    case "nevent": {
      const event = useSingleEvent(pointer.data.id, pointer.data.relays);
      if (event === undefined) return <NoteLink noteId={pointer.data.id} />;
      return <EmbedEvent event={event} {...props} />;
    }
    case "naddr": {
      const event = useReplaceableEvent(pointer.data);
      if (!event) return <span>{nip19.naddrEncode(pointer.data)}</span>;
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
