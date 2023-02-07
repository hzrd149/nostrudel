import { Link, LinkProps } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Bech32Prefix, normalizeToBech32 } from "../helpers/nip-19";
import { truncatedId } from "../helpers/nostr-event";

export type NoteLinkProps = LinkProps & {
  noteId: string;
};

export const NoteLink = ({ noteId, ...props }: NoteLinkProps) => {
  const note1 = normalizeToBech32(noteId, Bech32Prefix.Note) ?? noteId;

  return (
    <Link as={RouterLink} to={`/n/${note1}`} {...props}>
      {truncatedId(note1)}
    </Link>
  );
};
