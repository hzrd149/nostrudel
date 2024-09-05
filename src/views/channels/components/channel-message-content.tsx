import { memo, useMemo } from "react";
import { Box, BoxProps } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import {
  embedCashuTokens,
  embedEmoji,
  embedImageGallery,
  embedLightningInvoice,
  embedNipDefinitions,
  embedNostrHashtags,
  embedNostrLinks,
  embedNostrMentions,
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
import { LightboxProvider } from "../../../components/lightbox-provider";
import { renderAudioUrl } from "../../../components/external-embeds/types/audio";

const ChannelMessageContent = memo(({ message, children, ...props }: BoxProps & { message: NostrEvent }) => {
  const content = useMemo(() => {
    let c: EmbedableContent = [message.content];

    // image gallery
    c = embedImageGallery(c, message);

    // common
    c = embedUrls(c, [
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

    // bitcoin
    c = embedLightningInvoice(c);

    // cashu
    c = embedCashuTokens(c);

    // nostr
    c = embedNostrLinks(c);
    c = embedNostrMentions(c, message);
    c = embedNostrHashtags(c, message);
    c = embedNipDefinitions(c);
    c = embedEmoji(c, message);

    return c;
  }, [message.content]);

  return (
    <TrustProvider event={message}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>
      </LightboxProvider>
    </TrustProvider>
  );
});

export default ChannelMessageContent;
