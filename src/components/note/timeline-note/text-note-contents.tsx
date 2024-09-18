import React, { Suspense } from "react";
import { Box, BoxProps, Spinner } from "@chakra-ui/react";
import { EventTemplate, NostrEvent } from "nostr-tools";

import { EmbedableContent, embedUrls, truncateEmbedableContent } from "../../../helpers/embeds";
import {
  embedLightningInvoice,
  embedNostrLinks,
  embedNostrMentions,
  embedNostrHashtags,
  renderWavlakeUrl,
  renderYoutubeURL,
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
  renderAudioUrl,
  renderModelUrl,
  renderCodePenURL,
  renderArchiveOrgURL,
  renderStreamUrl,
} from "../../external-embeds";
import { LightboxProvider } from "../../lightbox-provider";
import MediaOwnerProvider from "../../../providers/local/media-owner-provider";
import { embedNostrWikiLinks } from "../../external-embeds/types/wiki";

function buildContents(event: NostrEvent | EventTemplate, simpleLinks = false) {
  let content: EmbedableContent = [event.content.trim()];

  // image gallery
  content = embedImageGallery(content, event as NostrEvent);

  // common
  content = embedUrls(content, [
    renderSimpleXLink,
    renderYoutubeURL,
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
    renderStreamUrl,
    renderAudioUrl,
    renderModelUrl,
    renderCodePenURL,
    renderArchiveOrgURL,
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
  content = embedNostrWikiLinks(content);

  return content;
}

export type TextNoteContentsProps = {
  event: NostrEvent | EventTemplate;
  noOpenGraphLinks?: boolean;
  maxLength?: number;
};

export const TextNoteContents = React.memo(
  ({ event, noOpenGraphLinks, maxLength, ...props }: TextNoteContentsProps & Omit<BoxProps, "children">) => {
    let content = buildContents(event, noOpenGraphLinks);

    if (maxLength !== undefined) {
      content = truncateEmbedableContent(content, maxLength);
    }

    return (
      <MediaOwnerProvider owner={(event as NostrEvent).pubkey as string | undefined}>
        <LightboxProvider>
          <Suspense fallback={<Spinner />}>
            <Box whiteSpace="pre-wrap" {...props}>
              {content}
            </Box>
          </Suspense>
        </LightboxProvider>
      </MediaOwnerProvider>
    );
  },
);

export default TextNoteContents;
