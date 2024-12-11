import { useMemo } from "react";
import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { nip19 } from "nostr-tools";

import { truncatedId } from "../../helpers/nostr/event";
import { getEventPointerRelayHints } from "../../services/relay-hints";

export type NoteLinkProps = LinkProps & {
  noteId: string;
};

export function NoteLink({ children, noteId, color = "blue.500", ...props }: NoteLinkProps) {
  const nevent = useMemo(() => {
    const relays = getEventPointerRelayHints(noteId).slice(0, 2);
    return nip19.neventEncode({ id: noteId, relays });
  }, [noteId]);

  return (
    <Link as={RouterLink} to={`/n/${nevent}`} color={color} {...props}>
      {children || truncatedId(nevent)}
    </Link>
  );
}

export default NoteLink;
