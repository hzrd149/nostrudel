import { Box, Text } from "@chakra-ui/react";
import { NostrEvent } from "../../../types/nostr-event";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { TrustProvider } from "../../../providers/trust";
import UserAvatar from "../../../components/user-avatar";
import { UserLink } from "../../../components/user-link";
import { memo, useMemo, useRef } from "react";
import { EmbedableContent, embedUrls } from "../../../helpers/embeds";
import {
  embedEmoji,
  embedNostrHashtags,
  embedNostrLinks,
  embedNostrMentions,
  renderGenericUrl,
  renderImageUrl,
  renderSoundCloudUrl,
  renderStemstrUrl,
  renderWavlakeUrl,
} from "../../../components/embed-types";
import NoteZapButton from "../../../components/note/note-zap-button";
import Timestamp from "../../../components/timestamp";

const ChatMessageContent = memo(({ message }: { message: NostrEvent }) => {
  const content = useMemo(() => {
    let c: EmbedableContent = [message.content];

    c = embedUrls(c, [renderImageUrl, renderWavlakeUrl, renderStemstrUrl, renderSoundCloudUrl, renderGenericUrl]);

    // nostr
    c = embedNostrLinks(c);
    c = embedNostrMentions(c, message);
    c = embedNostrHashtags(c, message);
    c = embedEmoji(c, message);

    return c;
  }, [message.content]);

  return <>{content}</>;
});

function ChannelChatMessage({ message, channel }: { message: NostrEvent; channel: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, message.id);

  return (
    <TrustProvider event={message}>
      <Box>
        <Box overflow="hidden" maxH="lg" ref={ref}>
          <UserAvatar pubkey={message.pubkey} size="xs" display="inline-block" mr="2" />
          <Text as="span" fontWeight="bold" color={message.pubkey === channel.pubkey ? "purple.200" : "blue.200"}>
            <UserLink pubkey={message.pubkey} />
            {": "}
          </Text>
          <Timestamp timestamp={message.created_at} float="right" />
          <NoteZapButton
            display="inline-block"
            event={message}
            size="xs"
            variant="ghost"
            float="right"
            mx="2"
            allowComment={false}
          />
          <ChatMessageContent message={message} />
        </Box>
      </Box>
    </TrustProvider>
  );
}

export default memo(ChannelChatMessage);
