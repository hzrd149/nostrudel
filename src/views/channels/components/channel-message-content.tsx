import { memo, useMemo } from "react";
import { Box, BoxProps } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import { TrustProvider } from "../../../providers/local/trust";
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
  renderTidalUrl,
  renderTwitterUrl,
  renderVideoUrl,
  renderWavlakeUrl,
  renderYoutubeUrl,
} from "../../../components/embed-types";
import { LightboxProvider } from "../../../components/lightbox-provider";

const ChannelMessageContent = memo(({ message, children, ...props }: BoxProps & { message: NostrEvent }) => {
  const content = useMemo(() => {
    let c: EmbedableContent = [message.content];

    // image gallery
    c = embedImageGallery(c, message);

    // common
    c = embedUrls(c, [
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

// function ChannelChatMessage({ message, channel }: { message: NostrEvent; channel: NostrEvent }) {
//   const ref = useRef<HTMLDivElement | null>(null);
//   useRegisterIntersectionEntity(ref, message.id);

//   return (
//     <TrustProvider event={message}>
//       <Box>
//         <Box overflow="hidden" maxH="lg" ref={ref}>
//           <UserAvatar pubkey={message.pubkey} size="xs" display="inline-block" mr="2" />
//           <Text as="span" fontWeight="bold" color={message.pubkey === channel.pubkey ? "purple.200" : "blue.200"}>
//             <UserLink pubkey={message.pubkey} />
//             {": "}
//           </Text>
//           <Timestamp timestamp={message.created_at} float="right" />
//           <NoteZapButton
//             display="inline-block"
//             event={message}
//             size="xs"
//             variant="ghost"
//             float="right"
//             mx="2"
//             allowComment={false}
//           />
//           <ChannelMessageContent message={message} />
//         </Box>
//       </Box>
//     </TrustProvider>
//   );
// }

// export default memo(ChannelChatMessage);
