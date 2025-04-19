import { textNoteTransformers } from "applesauce-content/text";
import { useRenderedContent } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import React from "react";

import { components } from "../../../../components/content";
import {
  renderGenericUrl,
  renderImageUrl,
  renderSoundCloudUrl,
  renderStemstrUrl,
  renderWavlakeUrl,
} from "../../../../components/content/links";
import { bipDefinitions } from "../../../../components/content/transform/bip-notation";
import { nipDefinitions } from "../../../../components/content/transform/nip-notation";

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
