import React from "react";
import { useRenderedContent } from "applesauce-react/hooks";

import {
  renderGenericUrl,
  renderImageUrl,
  renderSoundCloudUrl,
  renderStemstrUrl,
  renderWavlakeUrl,
} from "../../../../components/content/links";
import { NostrEvent } from "../../../../types/nostr-event";
import { components } from "../../../../components/content";
import { textNoteTransformers } from "applesauce-content/text";
import { nipDefinitions } from "../../../../components/content/transform/nip-notation";
import { bipDefinitions } from "../../../../components/content/transform/bip-notation";

const StreamChatMessageContentSymbol = Symbol.for("stream-chat-message-content");
const transformers = [...textNoteTransformers, nipDefinitions, bipDefinitions];
const linkRenderers = [renderImageUrl, renderWavlakeUrl, renderStemstrUrl, renderSoundCloudUrl, renderGenericUrl];

const ChatMessageContent = React.memo(({ event }: { event: NostrEvent }) => {
  const content = useRenderedContent(event, components, {
    transformers,
    linkRenderers,
    cacheKey: StreamChatMessageContentSymbol,
  });

  return <>{content}</>;
});

export default ChatMessageContent;
