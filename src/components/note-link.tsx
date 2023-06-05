import { useMemo } from "react";
import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { truncatedId } from "../helpers/nostr-event";
import { nip19 } from "nostr-tools";
import { getSharableNoteId } from "../helpers/nip19";

export type NoteLinkProps = LinkProps & {
  noteId: string;
};

export const NoteLink = ({ children, noteId, color = "blue.500", ...props }: NoteLinkProps) => {
  const encoded = useMemo(() => getSharableNoteId(noteId), [noteId]);

  return (
    <Link as={RouterLink} to={`/n/${encoded}`} color={color} {...props}>
      {children || truncatedId(nip19.noteEncode(noteId))}
    </Link>
  );
};
