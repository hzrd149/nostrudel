import { useMemo } from "react";
import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { truncatedId } from "../helpers/nostr/events";

export type NoteLinkProps = LinkProps & {
  noteId: string;
};

export const NoteLink = ({ children, noteId, color = "blue.500", ...props }: NoteLinkProps) => {
  const encoded = useMemo(() => nip19.noteEncode(noteId), [noteId]);

  return (
    <Link as={RouterLink} to={`/n/${encoded}`} color={color} {...props}>
      {children || truncatedId(nip19.noteEncode(noteId))}
    </Link>
  );
};
