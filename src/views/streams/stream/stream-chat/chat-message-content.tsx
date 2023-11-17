import React, { useMemo } from "react";

import { EmbedableContent, embedUrls } from "../../../../helpers/embeds";
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
} from "../../../../components/embed-types";
import { NostrEvent } from "../../../../types/nostr-event";

const ChatMessageContent = React.memo(({ event }: { event: NostrEvent }) => {
  const content = useMemo(() => {
    let c: EmbedableContent = [event.content];

    c = embedUrls(c, [renderImageUrl, renderWavlakeUrl, renderStemstrUrl, renderSoundCloudUrl, renderGenericUrl]);

    // nostr
    c = embedNostrLinks(c);
    c = embedNostrMentions(c, event);
    c = embedNostrHashtags(c, event);
    c = embedEmoji(c, event);

    return c;
  }, [event.content]);

  return <>{content}</>;
});

export default ChatMessageContent;
