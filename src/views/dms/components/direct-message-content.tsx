import { useMemo } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react";

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
} from "../../../components/external-embeds";
import { TrustProvider } from "../../../providers/local/trust-provider";
import { LightboxProvider } from "../../../components/lightbox-provider";
import { renderAudioUrl } from "../../../components/external-embeds/types/audio";
import buildLinkComponent from "../../../components/content/links";
import { components } from "../../../components/content";
import { useKind4Decrypt } from "../../../hooks/use-kind4-decryption";

export default function DirectMessageContent({
  event,
  text,
  children,
  ...props
}: { event: NostrEvent; text: string } & BoxProps) {
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

  const { plaintext } = useKind4Decrypt(event);
  const content = useRenderedContent(event, componentsMap, plaintext);

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
