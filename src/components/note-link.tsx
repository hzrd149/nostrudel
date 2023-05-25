import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { truncatedId } from "../helpers/nostr-event";
import { nip19 } from "nostr-tools";
import { getEventRelays } from "../services/event-relays";
import relayScoreboardService from "../services/relay-scoreboard";
import { useMemo } from "react";

export function getSharableEncodedNoteId(eventId: string) {
  const relays = getEventRelays(eventId).value;
  const ranked = relayScoreboardService.getRankedRelays(relays);
  const onlyTwo = ranked.slice(0, 2);

  if (onlyTwo.length > 0) {
    return nip19.neventEncode({ id: eventId, relays: onlyTwo });
  } else return nip19.noteEncode(eventId);
}

export type NoteLinkProps = LinkProps & {
  noteId: string;
};

export const NoteLink = ({ children, noteId, color = "blue.500", ...props }: NoteLinkProps) => {
  const encoded = useMemo(() => getSharableEncodedNoteId(noteId), [noteId]);

  return (
    <Link as={RouterLink} to={`/n/${encoded}`} color={color} {...props}>
      {children || truncatedId(nip19.noteEncode(noteId))}
    </Link>
  );
};
