import React from "react";
import { Box, BoxProps } from "@chakra-ui/react";
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
  embedImageGallery,
} from "../embed-types";
import { LightboxProvider } from "../lightbox-provider";
import { renderRedditUrl } from "../embed-types/reddit";

function buildContents(event: NostrEvent | DraftNostrEvent) {
  let content: EmbedableContent = [event.content.trim()];

  // image gallery
  content = embedImageGallery(content, event as NostrEvent);

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

export const NoteContents = React.memo(({ event, ...props }: NoteContentsProps & Omit<BoxProps, "children">) => {
  const content = buildContents(event);

  return (
    <LightboxProvider>
      <Box whiteSpace="pre-wrap" {...props}>
        {content}
      </Box>
    </LightboxProvider>
  );
});
