import { Box, BoxProps } from "@chakra-ui/react";
import { useRenderedContent } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import React from "react";

import { isRumor, Rumor } from "applesauce-core/helpers";
import { components } from "../../../components/content";
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
import { renderAudioUrl } from "../../../components/content/links/audio";
import { LightboxProvider } from "../../../components/lightbox-provider";
import { useLegacyMessagePlaintext } from "../../../hooks/use-legacy-message-plaintext";
import { ContentSettingsProvider } from "../../../providers/local/content-settings";
import DecryptPlaceholder from "./decrypt-placeholder";

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

function LegacyDirectMessageContent({
  message,
  text,
  children,
  ...props
}: { message: NostrEvent; text: string; children?: React.ReactNode } & BoxProps) {
  const plaintext = useLegacyMessagePlaintext(message).plaintext;
  const content = useRenderedContent(plaintext, components, { linkRenderers, cacheKey: DirectMessageContentSymbol });

  return (
    <ContentSettingsProvider event={message}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>
      </LightboxProvider>
    </ContentSettingsProvider>
  );
}

function WrappedDirectMessageContent({
  message,
  children,
  ...props
}: { message: Rumor; children?: React.ReactNode } & BoxProps) {
  const content = useRenderedContent(message, components, { linkRenderers, cacheKey: DirectMessageContentSymbol });

  return (
    <ContentSettingsProvider event={message as NostrEvent}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>
      </LightboxProvider>
    </ContentSettingsProvider>
  );
}

export default function DirectMessageContent({
  message,
  children,
  ...props
}: { message: NostrEvent | Rumor; children?: React.ReactNode } & BoxProps) {
  if (isRumor(message)) {
    return <WrappedDirectMessageContent message={message} children={children} {...props} />;
  } else {
    return (
      <DecryptPlaceholder message={message}>
        {(text) => <LegacyDirectMessageContent message={message} text={text} children={children} {...props} />}
      </DecryptPlaceholder>
    );
  }
}
