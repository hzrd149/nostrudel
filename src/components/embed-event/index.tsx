import type { DecodeResult } from "nostr-tools/lib/nip19";
import { Link } from "@chakra-ui/react";

import EmbeddedNote from "./event-types/embedded-note";
import useSingleEvent from "../../hooks/use-single-event";
import { NoteLink } from "../note-link";
import { NostrEvent } from "../../types/nostr-event";
import { Kind, nip19 } from "nostr-tools";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import RelayCard from "../../views/relays/components/relay-card";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import { GOAL_KIND } from "../../helpers/nostr/goal";
import GoalCard from "../../views/goals/components/goal-card";
import { getSharableEventAddress, safeDecode } from "../../helpers/nip19";
import EmbeddedStream from "./event-types/embedded-stream";
import { EMOJI_PACK_KIND } from "../../helpers/nostr/emoji-packs";
import EmbeddedEmojiPack from "./event-types/embedded-emoji-pack";
import { buildAppSelectUrl } from "../../helpers/nostr/apps";
import EmbeddedGoal from "./event-types/embedded-goal";

export function EmbedEvent({ event }: { event: NostrEvent }) {
  switch (event.kind) {
    case Kind.Text:
      return <EmbeddedNote event={event} />;
    case STREAM_KIND:
      return <EmbeddedStream event={event} />;
    case GOAL_KIND:
      return <EmbeddedGoal goal={event} />;
    case EMOJI_PACK_KIND:
      return <EmbeddedEmojiPack pack={event} />;
  }

  const address = getSharableEventAddress(event);
  return (
    <Link href={address ? buildAppSelectUrl(address) : ""} isExternal color="blue.500">
      {address}
    </Link>
  );
}

export function EmbedEventPointer({ pointer }: { pointer: DecodeResult }) {
  switch (pointer.type) {
    case "note": {
      const { event } = useSingleEvent(pointer.data);
      if (event === undefined) return <NoteLink noteId={pointer.data} />;
      return <EmbedEvent event={event} />;
    }
    case "nevent": {
      const { event } = useSingleEvent(pointer.data.id, pointer.data.relays);
      if (event === undefined) return <NoteLink noteId={pointer.data.id} />;
      return <EmbedEvent event={event} />;
    }
    case "naddr": {
      const event = useReplaceableEvent(pointer.data);
      if (!event) return <span>{nip19.naddrEncode(pointer.data)}</span>;
      return <EmbedEvent event={event} />;
    }
    case "nrelay":
      return <RelayCard url={pointer.data} />;
  }
  return null;
}

export function EmbedEventNostrLink({ link }: { link: string }) {
  const pointer = safeDecode(link);

  return pointer ? <EmbedEventPointer pointer={pointer} /> : <>{link}</>;
}
