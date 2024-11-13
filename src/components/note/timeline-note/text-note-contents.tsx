import React, { Suspense, useMemo } from "react";
import { Box, BoxProps, Spinner } from "@chakra-ui/react";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { useRenderedContent } from "applesauce-react/hooks";
import { textNoteTransformers, TextNoteContentSymbol, galleries } from "applesauce-content/text";

import {
  renderWavlakeUrl,
  renderYoutubeURL,
  renderImageUrl,
  renderTwitterUrl,
  renderAppleMusicUrl,
  renderSpotifyUrl,
  renderTidalUrl,
  renderVideoUrl,
  renderOpenGraphUrl,
  renderSongDotLinkUrl,
  renderStemstrUrl,
  renderSoundCloudUrl,
  renderSimpleXLink,
  renderRedditUrl,
  renderAudioUrl,
  renderModelUrl,
  renderCodePenURL,
  renderArchiveOrgURL,
  renderStreamUrl,
} from "../../content/links";
import { LightboxProvider } from "../../lightbox-provider";
import MediaOwnerProvider from "../../../providers/local/media-owner-provider";
import { components } from "../../content";
import { nipDefinitions } from "../../content/transform/nip-notation";

const transformers = [...textNoteTransformers, galleries, nipDefinitions];

export type TextNoteContentsProps = {
  event: NostrEvent | EventTemplate;
  noOpenGraphLinks?: boolean;
  maxLength?: number;
};

const linkRenderers = [
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
  renderOpenGraphUrl,
];

export const TextNoteContents = React.memo(
  ({ event, noOpenGraphLinks, maxLength, ...props }: TextNoteContentsProps & Omit<BoxProps, "children">) => {
    const content = useRenderedContent(event, components, {
      linkRenderers,
      transformers,
      maxLength,
      cacheKey: TextNoteContentSymbol,
    });

    return (
      <MediaOwnerProvider owner={(event as NostrEvent).pubkey as string | undefined}>
        <LightboxProvider>
          <Suspense fallback={<Spinner />}>
            <Box whiteSpace="pre-wrap" dir="auto" {...props}>
              {content}
            </Box>
          </Suspense>
        </LightboxProvider>
      </MediaOwnerProvider>
    );
  },
);

export default TextNoteContents;
