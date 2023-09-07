import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/react";
import { Navigate, useParams } from "react-router-dom";
import { nip19 } from "nostr-tools";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import { EMOJI_PACK_KIND } from "../../helpers/nostr/emoji-packs";
import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../../helpers/nostr/lists";

export default function NostrLinkView() {
  const { link } = useParams() as { link?: string };

  if (!link)
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>No link provided</AlertTitle>
      </Alert>
    );

  const cleanLink = link.replace(/(web\+)?nostr:(\/\/)?/, "");
  const decoded = nip19.decode(cleanLink);

  switch (decoded.type) {
    case "npub":
    case "nprofile":
      return <Navigate to={`/u/${cleanLink}`} replace />;
    case "note":
    case "nevent":
      return <Navigate to={`/n/${cleanLink}`} replace />;
    case "naddr":
      if (decoded.data.kind === STREAM_KIND) return <Navigate to={`/streams/${cleanLink}`} replace />;
      if (decoded.data.kind === EMOJI_PACK_KIND) return <Navigate to={`/emojis/${cleanLink}`} replace />;
      if (decoded.data.kind === NOTE_LIST_KIND) return <Navigate to={`/lists/${cleanLink}`} replace />;
      if (decoded.data.kind === PEOPLE_LIST_KIND) return <Navigate to={`/lists/${cleanLink}`} replace />;
  }

  return (
    <Alert status="warning">
      <AlertIcon />
      <AlertTitle>Unknown type</AlertTitle>
    </Alert>
  );
}
