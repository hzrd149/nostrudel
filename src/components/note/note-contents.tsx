import React from "react";
import { Box } from "@chakra-ui/react";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { EmbedableContent, embedUrls } from "../../helpers/embeds";
import {
  embedLightningInvoice,
  embedNostrLinks,
  embedNostrMentions,
  embedNostrHashtags,
  renderWavlakeUrl,
  renderYoutubeUrl,
  renderImageUrl,
  renderTwitterUrl,
  renderAppleMusicUrl,
  renderSpotifyUrl,
  renderTidalUrl,
  renderVideoUrl,
  embedEmoji,
  renderOpenGraphUrl,
} from "../embed-types";
import { ImageGalleryProvider } from "../image-gallery";
import { renderRedditUrl } from "../embed-types/reddit";

function buildContents(event: NostrEvent | DraftNostrEvent) {
  let content: EmbedableContent = [event.content.trim()];

  // common
  content = embedUrls(content, [
    renderYoutubeUrl,
    renderTwitterUrl,
    renderRedditUrl,
    renderWavlakeUrl,
    renderAppleMusicUrl,
    renderSpotifyUrl,
    renderTidalUrl,
    renderImageUrl,
    renderVideoUrl,
    renderOpenGraphUrl,
  ]);

  // bitcoin
  content = embedLightningInvoice(content);

  // nostr
  content = embedNostrLinks(content);
  content = embedNostrMentions(content, event);
  content = embedNostrHashtags(content, event);
  content = embedEmoji(content, event);

  return content;
}

export type NoteContentsProps = {
  event: NostrEvent | DraftNostrEvent;
};

export const NoteContents = React.memo(({ event }: NoteContentsProps) => {
  const content = buildContents(event);

  return (
    <ImageGalleryProvider>
      <Box whiteSpace="pre-wrap" px="2">
        {content}
      </Box>
    </ImageGalleryProvider>
  );
});
