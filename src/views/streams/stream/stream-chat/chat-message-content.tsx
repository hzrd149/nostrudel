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

const linkRenderers = [renderImageUrl, renderWavlakeUrl, renderStemstrUrl, renderSoundCloudUrl, renderGenericUrl];

const ChatMessageContent = React.memo(({ event }: { event: NostrEvent }) => {
  const content = useRenderedContent(event, components, { linkRenderers });

  return <>{content}</>;
});

export default ChatMessageContent;
