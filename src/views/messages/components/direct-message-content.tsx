import { Box, BoxProps, Text } from "@chakra-ui/react";
import { useRenderedContent, use$ } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import React, { useMemo } from "react";

import {
  getRumorGiftWraps,
  getMessageAttachments,
  getWrappedMessageParent,
  getConversationParticipants,
  Rumor,
} from "applesauce-common/helpers";
import { getExpirationTimestamp } from "applesauce-core/helpers";
import dayjs from "dayjs";
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
import DecryptPlaceholder from "../chat/components/decrypt-placeholder";
import MessageAttachment from "./message-attachment";
import MessageParent from "./message-parent";
import useMessaging from "../../../hooks/use-messaging";

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
  renderSoundCloudUrl,
  renderImageUrl,
  renderVideoUrl,
  renderStreamUrl,
  renderAudioUrl,
  renderGenericUrl,
];

function LegacyDirectMessageContent({
  message,
  text: _text,
  children,
  ...props
}: { message: NostrEvent; text: string; children?: React.ReactNode } & BoxProps) {
  const plaintext = useLegacyMessagePlaintext(message).plaintext;
  const content = useRenderedContent(plaintext, components, { linkRenderers, cacheKey: DirectMessageContentSymbol });

  const expirationTimestamp = getExpirationTimestamp(message);

  return (
    <ContentSettingsProvider event={message}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {content}
          {children}
        </Box>

        {expirationTimestamp && <Text color="orange.500">Disappears: {dayjs.unix(expirationTimestamp).fromNow()}</Text>}
      </LightboxProvider>
    </ContentSettingsProvider>
  );
}

function WrappedDirectMessageContent({
  message,
  children,
  ...props
}: { message: Rumor; children?: React.ReactNode } & BoxProps) {
  const session = useMessaging();
  const conversation = useMemo(
    () => session?.wrapped.conversation(getConversationParticipants(message)),
    [session, message],
  );
  const publications = use$(() => session?.wrapped.publications$, [session]);
  const parent = getWrappedMessageParent(message);
  const attachments = useMemo(() => getMessageAttachments(message), [message]);
  const content = useRenderedContent(message, components, { linkRenderers, cacheKey: DirectMessageContentSymbol });
  const expirationTimestamp = useMemo(() => {
    const expiration = getExpirationTimestamp(message);
    if (expiration) return expiration;
    const giftWraps = getRumorGiftWraps(message);
    for (const giftWrap of giftWraps) {
      const ts = getExpirationTimestamp(giftWrap);
      if (ts) return ts;
    }
    return undefined;
  }, [message]);

  return (
    <ContentSettingsProvider event={message as NostrEvent}>
      <LightboxProvider>
        <Box whiteSpace="pre-wrap" {...props}>
          {parent && conversation && <MessageParent conversation={conversation} id={parent} />}
          {message.kind !== kinds.FileMessage && content}
          {attachments.map((file) => (
            <MessageAttachment key={file.url} file={file} />
          ))}
          {children}
        </Box>
        {publications?.[message.id] && <Text color="GrayText">{publications[message.id]}</Text>}

        {expirationTimestamp && <Text color="orange.500">Disappears: {dayjs.unix(expirationTimestamp).fromNow()}</Text>}
      </LightboxProvider>
    </ContentSettingsProvider>
  );
}

function isWrappedMessage(message: NostrEvent | Rumor): message is Rumor {
  return message.kind === kinds.PrivateDirectMessage || message.kind === kinds.FileMessage;
}

export default function DirectMessageContent({
  message,
  children,
  ...props
}: { message: NostrEvent | Rumor; children?: React.ReactNode } & BoxProps) {
  if (isWrappedMessage(message)) {
    return <WrappedDirectMessageContent message={message} children={children} {...props} />;
  } else {
    return (
      <DecryptPlaceholder message={message}>
        {(text) => <LegacyDirectMessageContent message={message} text={text} children={children} {...props} />}
      </DecryptPlaceholder>
    );
  }
}
