import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";

import { NostrEvent } from "../../../types/nostr-event";
import {
  renderAppleMusicUrl,
  renderGenericUrl,
  renderImageUrl,
  renderRedditUrl,
  renderSimpleXLink,
  renderSongDotLinkUrl,
  renderSoundCloudUrl,
  renderSpotifyUrl,
  renderStemstrUrl,
  renderStreamUrl,
  renderTidalUrl,
  renderTwitterUrl,
  renderVideoUrl,
  renderWavlakeUrl,
  renderYoutubeURL,
} from "../../../components/content/links";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { LightboxProvider } from "../../../components/lightbox-provider";
import { renderAudioUrl } from "../../../components/content/links/audio";
import { components } from "../../../components/content";
import { useKind4Decrypt } from "../../../hooks/use-kind4-decryption";

const DirectMessageContentSymbol = Symbol.for("direct-message-content");
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
  renderGenericUrl,
];

export default function DirectMessageContent({
  event,
  text,
  children,
  ...props
}: { event: NostrEvent; text: string } & BoxProps) {
  const { plaintext } = useKind4Decrypt(event);
  const content = useRenderedContent(plaintext, components, { linkRenderers, cacheKey: DirectMessageContentSymbol });

  return (
    <TrustProvider event={event}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>
      </LightboxProvider>
    </TrustProvider>
  );
}
