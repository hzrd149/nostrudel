import { memo, useMemo } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react";

import { NostrEvent } from "../../../types/nostr-event";
import { TrustProvider } from "../../../providers/local/trust-provider";
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
} from "../../../components/external-embeds";
import { LightboxProvider } from "../../../components/lightbox-provider";
import { renderAudioUrl } from "../../../components/external-embeds/types/audio";
import buildLinkComponent from "../../../components/content/links";
import { components } from "../../../components/content";

const ChannelMessageContent = memo(({ message, children, ...props }: BoxProps & { message: NostrEvent }) => {
  // const content = useMemo(() => {
  //   let c: EmbedableContent = [message.content];

  //   // image gallery
  //   c = embedImageGallery(c, message);

  //   // common
  //   c = embedUrls(c, [
  //     renderSimpleXLink,
  //     renderYoutubeURL,
  //     renderTwitterUrl,
  //     renderRedditUrl,
  //     renderWavlakeUrl,
  //     renderAppleMusicUrl,
  //     renderSpotifyUrl,
  //     renderTidalUrl,
  //     renderSongDotLinkUrl,
  //     renderStemstrUrl,
  //     renderSoundCloudUrl,
  //     renderImageUrl,
  //     renderVideoUrl,
  //     renderStreamUrl,
  //     renderAudioUrl,
  //     renderGenericUrl,
  //   ]);

  //   // bitcoin
  //   c = embedLightningInvoice(c);

  //   // cashu
  //   c = embedCashuTokens(c);

  //   // nostr
  //   c = embedNostrLinks(c);
  //   c = embedNostrMentions(c, message);
  //   c = embedNostrHashtags(c, message);
  //   c = embedNipDefinitions(c);
  //   c = embedEmoji(c, message);

  //   return c;
  // }, [message.content]);

  const LinkComponent = useMemo(
    () =>
      buildLinkComponent([
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
      ]),
    [],
  );
  const componentsMap = useMemo(
    () => ({
      ...components,
      link: LinkComponent,
    }),
    [LinkComponent],
  );

  const content = useRenderedContent(message, componentsMap);

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
