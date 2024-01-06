import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/react";
import { Navigate, useParams } from "react-router-dom";
import { Kind, nip19 } from "nostr-tools";
import { STREAM_KIND } from "../../helpers/nostr/stream";
import { EMOJI_PACK_KIND } from "../../helpers/nostr/emoji-packs";
import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../../helpers/nostr/lists";
import { ErrorBoundary } from "../../components/error-boundary";
import { COMMUNITY_DEFINITION_KIND } from "../../helpers/nostr/communities";
import { TORRENT_KIND } from "../../helpers/nostr/torrents";
import { FLARE_VIDEO_KIND } from "../../helpers/nostr/flare";

function NostrLinkPage() {
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
      return <Navigate to={`/n/${cleanLink}`} replace />;
    case "nevent":
    case "naddr":
      if (decoded.data.kind === TORRENT_KIND) return <Navigate to={`/torrents/${cleanLink}`} replace />;
      if (decoded.data.kind === STREAM_KIND) return <Navigate to={`/streams/${cleanLink}`} replace />;
      if (decoded.data.kind === EMOJI_PACK_KIND) return <Navigate to={`/emojis/${cleanLink}`} replace />;
      if (decoded.data.kind === NOTE_LIST_KIND) return <Navigate to={`/lists/${cleanLink}`} replace />;
      if (decoded.data.kind === PEOPLE_LIST_KIND) return <Navigate to={`/lists/${cleanLink}`} replace />;
      if (decoded.data.kind === Kind.BadgeDefinition) return <Navigate to={`/badges/${cleanLink}`} replace />;
      if (decoded.data.kind === COMMUNITY_DEFINITION_KIND) return <Navigate to={`/c/${cleanLink}`} replace />;
      if (decoded.data.kind === FLARE_VIDEO_KIND) return <Navigate to={`/videos/${cleanLink}`} replace />;
      if (decoded.data.kind === Kind.ChannelCreation) return <Navigate to={`/channels/${cleanLink}`} replace />;
      if (decoded.data.kind === Kind.Text) return <Navigate to={`/n/${cleanLink}`} replace />;
      // if there is no kind redirect to the thread view
      return <Navigate to={`/n/${cleanLink}`} replace />;
  }

  return (
    <Alert status="warning">
      <AlertIcon />
      <AlertTitle>Unknown type {JSON.stringify(decoded.data)}</AlertTitle>
    </Alert>
  );
}

export default function NostrLinkView() {
  return (
    <ErrorBoundary>
      <NostrLinkPage />
    </ErrorBoundary>
  );
}
