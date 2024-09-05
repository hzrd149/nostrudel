import { Box, BoxProps } from "@chakra-ui/react";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import { NostrEvent } from "../../../types/nostr-event";
import {
  embedCashuTokens,
  embedNostrLinks,
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
} from "../../../components/external-embeds";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { LightboxProvider } from "../../../components/lightbox-provider";
import { renderAudioUrl } from "../../../components/external-embeds/types/audio";

export default function DirectMessageContent({
  event,
  text,
  children,
  ...props
}: { event: NostrEvent; text: string } & BoxProps) {
  let content: EmbedableContent = [text];

  content = embedNostrLinks(content);
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
    renderGenericUrl,
  ]);

  // cashu
  content = embedCashuTokens(content);

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
