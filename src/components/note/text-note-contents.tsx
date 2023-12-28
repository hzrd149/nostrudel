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
  embedCashuTokens,
  renderStemstrUrl,
  renderSoundCloudUrl,
  renderSimpleXLink,
  renderRedditUrl,
  embedNipDefinitions,
} from "../embed-types";
import { LightboxProvider } from "../lightbox-provider";
import { renderModelUrl } from "../embed-types/model";
import { renderAudioUrl } from "../embed-types/audio";

function buildContents(event: NostrEvent | DraftNostrEvent, simpleLinks = false) {
  let content: EmbedableContent = [event.content.trim()];

  // image gallery
  content = embedImageGallery(content, event as NostrEvent);

  // common
  content = embedUrls(content, [
    renderSimpleXLink,
    renderYoutubeUrl,
    renderTwitterUrl,
    renderRedditUrl,
    renderWavlakeUrl,
    renderAppleMusicUrl,
    renderSpotifyUrl,
    renderTidalUrl,
    renderSongDotLinkUrl,
    renderStemstrUrl,
    renderSoundCloudUrl,
    renderImageUrl,
    renderVideoUrl,
    renderAudioUrl,
    renderModelUrl,
    simpleLinks ? renderGenericUrl : renderOpenGraphUrl,
  ]);

  // bitcoin
  content = embedLightningInvoice(content);

  // cashu
  content = embedCashuTokens(content);

  // nostr
  content = embedNostrLinks(content);
  content = embedNostrMentions(content, event);
  content = embedNostrHashtags(content, event);
  content = embedNipDefinitions(content);
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
