import { useMemo } from "react";
import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { truncatedId } from "../helpers/nostr/events";
import { getNeventForEventId } from "../helpers/nip19";

export type NoteLinkProps = LinkProps & {
  noteId: string;
};

export const NoteLink = ({ children, noteId, color = "blue.500", ...props }: NoteLinkProps) => {
  const nevent = useMemo(() => getNeventForEventId(noteId), [noteId]);

  return (
    <Link as={RouterLink} to={`/n/${nevent}`} color={color} {...props}>
      {children || truncatedId(nevent)}
    </Link>
  );
};
