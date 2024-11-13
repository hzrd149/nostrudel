import React from "react";

import {
  renderGenericUrl,
  renderImageUrl,
  renderSoundCloudUrl,
  renderStemstrUrl,
  renderWavlakeUrl,
} from "../../../../components/content/links";
import { NostrEvent } from "../../../../types/nostr-event";
import { useRenderedContent } from "applesauce-react/hooks";
import { components } from "../../../../components/content";

const StreamChatMessageContentSymbol = Symbol.for("stream-chat-message-content");
const linkRenderers = [renderImageUrl, renderWavlakeUrl, renderStemstrUrl, renderSoundCloudUrl, renderGenericUrl];

const ChatMessageContent = React.memo(({ event }: { event: NostrEvent }) => {
  const content = useRenderedContent(event, components, { linkRenderers, cacheKey: StreamChatMessageContentSymbol });

  return <>{content}</>;
});

export default ChatMessageContent;
