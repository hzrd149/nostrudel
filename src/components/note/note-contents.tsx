import React from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import { EmbedableContent, embedUrls, truncateEmbedableContent } from "../../helpers/embeds";
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
  renderGenericUrl,
  renderSongDotLinkUrl,
} from "../embed-types";
import { LightboxProvider } from "../lightbox-provider";
import { renderRedditUrl } from "../embed-types/reddit";

function buildContents(event: NostrEvent | DraftNostrEvent, simpleLinks = false) {
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
    renderSongDotLinkUrl,
    renderImageUrl,
    renderVideoUrl,
    simpleLinks ? renderGenericUrl : renderOpenGraphUrl,
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
  noOpenGraphLinks?: boolean;
  maxLength?: number;
};

export const NoteContents = React.memo(
  ({ event, noOpenGraphLinks, maxLength, ...props }: NoteContentsProps & Omit<BoxProps, "children">) => {
    let content = buildContents(event, noOpenGraphLinks);

    if (maxLength !== undefined) {
      content = truncateEmbedableContent(content, maxLength);
    }

    return (
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
        </Box>
      </LightboxProvider>
    );
  },
);
